import { NextResponse, type NextRequest } from "next/server"
import QRCode from "qrcode"
import { checkoutSchema, fieldErrors } from "@/lib/validation"
import { getProduct } from "@/lib/products"
import { shippingFor, storeConfig } from "@/lib/store-config"
import { buildStaticPix } from "@/lib/pix-brcode"
import { newOrderId, saveOrder, type Order, type OrderItem } from "@/lib/server/orders-store"
import { abacatePayEnabled, createPixCharge } from "@/lib/server/abacatepay"

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

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados informados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  const { customer, address, items } = parsed.data

  // O preço SEMPRE vem do catálogo do servidor, nunca do navegador
  const merged = new Map<string, number>()
  for (const i of items) merged.set(i.slug, Math.min(20, (merged.get(i.slug) ?? 0) + i.quantity))
  const orderItems: OrderItem[] = []
  for (const [slug, quantity] of merged) {
    const product = getProduct(slug)
    if (!product) {
      return NextResponse.json({ error: "Um dos itens da sacola não está mais disponível." }, { status: 400 })
    }
    orderItems.push({ slug, name: product.name, price: product.price, quantity, image: product.images[0] })
  }
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

  saveOrder({
    id,
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
