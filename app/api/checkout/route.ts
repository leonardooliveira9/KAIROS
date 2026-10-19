import { NextResponse, type NextRequest } from "next/server"
import QRCode from "qrcode"
import { checkoutSchema, fieldErrors } from "@/lib/validation"
import { getProduct } from "@/lib/products"
import { CUSTOM_SLUG, customKey, customPrice, describeCustom, parseCustom } from "@/lib/customizer"
import { shippingFor, storeConfig } from "@/lib/store-config"
import { buildStaticPix } from "@/lib/pix-brcode"
import { newOrderId, saveOrder, type Order, type OrderItem } from "@/lib/server/orders-store"
import { abacatePayEnabled, createPixCharge } from "@/lib/server/abacatepay"
import { requestUser } from "@/lib/server/auth"
import { isFullyVerified, updateUser } from "@/lib/server/users-store"

export const runtime = "nodejs"

// Limite simples contra abuso: 10 pedidos por IP a cada 10 minutos
const hits = new Map<string, number[]>()
function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 10
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local"
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 })
  }

  // Compra exige conta com e-mail e telefone confirmados
  const user = await requestUser(request)
  if (!user) {
    return NextResponse.json({ error: "Entre na sua conta para finalizar a compra.", code: "login_required" }, { status: 401 })
  }
  if (!isFullyVerified(user)) {
    return NextResponse.json(
      { error: "Confirme seu e-mail e seu telefone antes de finalizar a compra.", code: "verification_required" },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  // e-mail e telefone usados no pedido são sempre os verificados da conta
  if (body?.customer) {
    body.customer.email = user.email
    body.customer.phone = user.phone
  }
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados informados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  const { customer, address, items } = parsed.data

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
      const product = getProduct(i.slug)
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
  const shipping = shippingFor(quantity)
  const total = Math.round((subtotal + shipping) * 100) / 100

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

  if (!user.cpf) await updateUser(user.id, { cpf: customer.cpf })

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
    total,
    payment,
  })

  const isProduction = process.env.NODE_ENV === "production"
  return NextResponse.json({
    orderId: id,
    subtotal,
    shipping,
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
