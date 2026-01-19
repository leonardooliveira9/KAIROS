import { NextRequest, NextResponse } from "next/server"
import { orders } from "../../orders/route"

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY
const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/api/v1"

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 })
    }

    const order = orders[orderId]
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    if (!ABACATEPAY_API_KEY) {
      return NextResponse.json(
        { error: "ABACATEPAY_API_KEY não configurada" },
        { status: 500 }
      )
    }

    const response = await fetch(`${ABACATEPAY_BASE_URL}/pix/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(order.total * 100),
        external_id: orderId,
        description: `Pedido ${orderId} - Kairos Terços`,
        expires_in: 3600,
        customer: {
          name: order.clientName,
          email: order.email,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(data)
      return NextResponse.json(
        { error: "Erro ao criar pagamento PIX" },
        { status: 500 }
      )
    }

    // salvar dados do pagamento
    order.paymentId = data.id
    order.paymentStatus = data.status

    return NextResponse.json({
      success: true,
      paymentId: data.id,
      qrCode: data.pix_qr_code,
      pixCopyPaste: data.pix_copy_paste,
      status: data.status,
    })
  } catch (err) {
    console.error("[ABACATEPAY CREATE ERROR]", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
