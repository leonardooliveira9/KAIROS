import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { orders } from "../../orders/route"

const WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {

    const signature = request.headers.get("x-signature")
    const rawBody = await request.text()

    if (!signature) {
      console.error("[WEBHOOK] Assinatura ausente")
      return NextResponse.json({ error: "Assinatura ausente" }, { status: 401 })
    }

    /**
     * 🔐 Validação da assinatura
     */
    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex")

    if (signature !== expectedSignature) {
      console.error("[WEBHOOK] Assinatura inválida")
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
    }

    const data = JSON.parse(rawBody)

    const paymentId = data.id
    const status = data.status
    const orderId = data.external_id

    console.log("[WEBHOOK] Dados recebidos:", {
      paymentId,
      orderId,
      status,
    })

    if (!orderId || !orders[orderId]) {
      console.warn("[WEBHOOK] Pedido não encontrado:", orderId)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = orders[orderId]

    /**
     * ✅ Processar status
     */
    if (status === "paid") {
      order.status = "paid"
      order.paidAt = new Date().toISOString()
      order.paymentId = paymentId

      console.log("[WEBHOOK] ✅ Pedido pago com sucesso:", orderId)
    }

    if (status === "expired" || status === "canceled") {
      order.status = "pending"
      console.log("[WEBHOOK] ⏳ Pagamento expirado/cancelado:", orderId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WEBHOOK] Erro interno:", error)
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}
