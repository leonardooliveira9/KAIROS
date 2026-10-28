import { NextResponse, type NextRequest } from "next/server"
import QRCode from "qrcode"
import { checkoutSchema, fieldErrors } from "@/lib/validation"
import { getProduct } from "@/lib/server/products-store"
import { CUSTOM_SLUG, customKey, customPrice, describeCustom, parseCustom } from "@/lib/customizer"
import { storeConfig } from "@/lib/store-config"
import { buildStaticPix } from "@/lib/pix-brcode"
import { newOrderId, saveOrder, type Order, type OrderItem } from "@/lib/server/orders-store"
import { abacatePayEnabled, createPixCharge } from "@/lib/server/abacatepay"
import { clientIp, requestUser } from "@/lib/server/auth"
import { takeRateLimit } from "@/lib/server/rate-limit"
import { quoteShipping, ShippingError } from "@/lib/server/shipping"
import { checkCoupon } from "@/lib/server/coupons-store"
import { couponDiscount, couponLabel } from "@/lib/coupons"
import { isFullyVerified, updateUser } from "@/lib/server/users-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  // limite contra abuso: 10 pedidos por IP a cada 10 minutos
  if (!takeRateLimit(`checkout:ip:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 })
  }

  // Compra exige conta com e-mail confirmado
  const user = await requestUser(request)
  if (!user) {
    return NextResponse.json({ error: "Entre na sua conta para finalizar a compra.", code: "login_required" }, { status: 401 })
  }
  if (!isFullyVerified(user)) {
    return NextResponse.json(
      { error: "Confirme seu e-mail antes de finalizar a compra.", code: "verification_required" },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  // o e-mail do pedido é sempre o confirmado da conta; o celular é o informado no checkout
  if (body?.customer) body.customer.email = user.email
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados informados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  const { customer, address, items, shippingService, couponCode } = parsed.data

  // O preço SEMPRE vem do catálogo do servidor, nunca do navegador
  const merged = new Map<string, OrderItem>()
  for (const i of items) {
    let item: Omit<OrderItem, "quantity">
    if (i.slug === CUSTOM_SLUG) {
      const custom = parseCustom(i.custom)
      if (!custom) return NextResponse.json({ error: "Confira as escolhas do terço personalizado." }, { status: 400 })
      item = {
        slug: CUSTOM_SLUG,
        name: "Terço Personalizado",
        price: customPrice(custom),
        image: "/artisan-hands-crafting-rosary-beads-workshop.jpg",
        custom,
        details: describeCustom(custom),
      }
    } else {
      const product = await getProduct(i.slug)
      if (!product) {
        return NextResponse.json({ error: "Um dos itens da sacola não está mais disponível." }, { status: 400 })
      }
      item = { slug: i.slug, name: product.name, price: product.price, image: product.images[0] }
    }
    const key = item.custom ? customKey(item.custom) : item.slug
    const quantity = Math.min(20, (merged.get(key)?.quantity ?? 0) + i.quantity)
    merged.set(key, { ...item, quantity })
  }
  const orderItems = [...merged.values()]
  const quantity = orderItems.reduce((s, i) => s + i.quantity, 0)
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0)

  // frete cotado de novo aqui: o navegador só diz qual serviço escolheu
  let shippingQuote
  try {
    shippingQuote = (await quoteShipping(address.cep, quantity)).find((q) => q.service === shippingService)
  } catch (err) {
    if (!(err instanceof ShippingError)) console.error("[checkout] frete", err)
    const message = err instanceof ShippingError ? err.message : "Não conseguimos calcular o frete agora."
    return NextResponse.json({ error: message, fields: { shippingService: message } }, { status: 422 })
  }
  if (!shippingQuote) {
    const message = "Esta forma de envio não está disponível para o seu CEP. Escolha outra."
    return NextResponse.json({ error: message, fields: { shippingService: message } }, { status: 422 })
  }
  const shipping = shippingQuote.price

  // cupom conferido aqui (validade, limite, mínimo); o desconto também é calculado aqui
  let coupon: Order["coupon"]
  let discount = 0
  if (couponCode) {
    const checked = await checkCoupon(couponCode, subtotal)
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error, fields: { couponCode: checked.error } }, { status: 422 })
    }
    discount = couponDiscount(checked.coupon, subtotal, shipping)
    coupon = { code: checked.coupon.code, label: couponLabel(checked.coupon) }
  }
  const total = Math.round((subtotal + shipping - discount) * 100) / 100
  if (total < 1) return NextResponse.json({ error: "O valor mínimo do pedido é R$ 1,00." }, { status: 422 })

  const id = newOrderId()
  const expiresIn = storeConfig.pix.expiresInSeconds
  let payment: Order["payment"]
  let qrImage: string

  try {
    if (abacatePayEnabled()) {
      const charge = await createPixCharge({
        amountCents: Math.round(total * 100),
        description: `Pedido ${id} - Kairos Tercos`,
        expiresIn,
        externalId: id,
        customer: { name: customer.fullName, email: customer.email, cellphone: customer.phone, taxId: customer.cpf },
      })
      payment = {
        provider: "abacatepay",
        chargeId: charge.id,
        devMode: charge.devMode,
        brCode: charge.brCode,
        expiresAt: charge.expiresAt,
      }
      qrImage = charge.brCodeBase64
    } else {
      const brCode = buildStaticPix({
        key: storeConfig.pix.key,
        amount: total,
        merchantName: storeConfig.pix.merchantName,
        merchantCity: storeConfig.pix.merchantCity,
        txid: id.replace("-", ""),
      })
      payment = {
        provider: "static_pix",
        brCode,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      }
      qrImage = await QRCode.toDataURL(brCode, { margin: 1, width: 320, errorCorrectionLevel: "M" })
    }
  } catch (err) {
    console.error("[checkout] falha ao gerar PIX", err)
    return NextResponse.json(
      { error: "Não conseguimos gerar o PIX agora. Tente novamente em instantes." },
      { status: 502 },
    )
  }

  // guarda na conta o que ainda não estava lá, para preencher a próxima compra
  if (!user.cpf || !user.phone) {
    await updateUser(user.id, { cpf: user.cpf || customer.cpf, phone: user.phone || customer.phone })
  }

  await saveOrder({
    id,
    userId: user.id,
    createdAt: new Date().toISOString(),
    status: "awaiting_payment",
    customer,
    address: { ...address, complement: address.complement ?? "", notes: address.notes ?? "" },
    items: orderItems,
    subtotal,
    shipping,
    shippingMethod: { service: shippingQuote.service, name: shippingQuote.name, days: shippingQuote.days },
    ...(coupon ? { coupon, discount } : {}),
    total,
    payment,
  })

  const isProduction = process.env.NODE_ENV === "production"
  return NextResponse.json({
    orderId: id,
    subtotal,
    shipping,
    shippingMethod: { name: shippingQuote.name, days: shippingQuote.days },
    discount,
    coupon: coupon ? { code: coupon.code, label: coupon.label } : null,
    total,
    payment: {
      mode: payment.provider,
      brCode: payment.brCode,
      qrImage,
      expiresAt: payment.expiresAt,
      // botão "Simular confirmação" só fora de produção, ou com chave sandbox da AbacatePay
      canSimulate: payment.provider === "abacatepay" ? Boolean(payment.devMode) : !isProduction,
    },
  })
}
