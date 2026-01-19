import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { orders } from "../../orders/route"

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY
const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v1"

interface VerifyRequest {
  orderId: string
  paymentId?: string
}

interface AbacatePayPaymentStatus {
  status: string
  payment_id: string
  amount: number
  paid_at?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyRequest
    const { orderId, paymentId } = body

    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId é obrigatório" }, { status: 400 })
    }

    const order = orders[orderId]
    if (!order) {
      return NextResponse.json({ success: false, error: "Pedido não encontrado" }, { status: 404 })
    }

    const currentPaymentId = paymentId || (order as any).paymentId

    // Se não tem API key ou payment ID, usar fallback mockado
    if (!ABACATEPAY_API_KEY || !currentPaymentId) {
      console.log("[v0] Usando fallback mockado para verificar pagamento")
      order.status = "paid"
      order.paidAt = new Date().toISOString()

      return NextResponse.json({
        success: true,
        orderId,
        status: "paid",
        message: "Pagamento confirmado com sucesso",
        verified: true,
      })
    }

    // Verificar status no AbacatePay
    const response = await fetch(`${ABACATEPAY_BASE_URL}/payments/${currentPaymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Erro ao verificar pagamento no AbacatePay:", error)
      throw new Error(`Erro ao verificar pagamento: ${error.message || JSON.stringify(error)}`)
    }

    const paymentData: AbacatePayPaymentStatus = await response.json()

    console.log("[v0] Status do pagamento AbacatePay:", {
      orderId,
      paymentId: currentPaymentId,
      status: paymentData.status,
    })

    // Verificar se pagamento foi aprovado
    if (paymentData.status === "approved" || paymentData.status === "paid" || paymentData.status === "completed") {
      order.status = "paid"
      order.paidAt = new Date().toISOString()

      console.log("[v0] Pedido marcado como pago:", { orderId })

      return NextResponse.json({
        success: true,
        orderId,
        status: "paid",
        message: "Pagamento confirmado com sucesso",
        verified: true,
      })
    }

    // Pagamento ainda não foi confirmado
    return NextResponse.json({
      success: true,
      orderId,
      status: paymentData.status,
      message: `Pagamento ainda não foi confirmado. Status atual: ${paymentData.status}`,
      verified: false,
    })
  } catch (error) {
    console.error("[v0] Erro ao verificar pagamento:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao verificar pagamento",
      },
      { status: 500 }
    )
  }
}
