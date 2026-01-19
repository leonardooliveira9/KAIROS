import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Banco de dados temporário de pagamentos
const paymentsDatabase: Record<string, any> = {}

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const { paymentId } = params

    // Em produção, consultaria a API do Gerencianet ou banco
    const payment = paymentsDatabase[paymentId]

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        status: payment.status,
        orderId: payment.orderId,
        amount: payment.amount,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar pagamento:", error)
    return NextResponse.json({ error: "Erro ao buscar status do pagamento" }, { status: 500 })
  }
}
