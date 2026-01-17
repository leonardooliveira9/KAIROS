import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Simular verificação de pagamento
const verifiedPayments: Set<string> = new Set()

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId

    // Simular que o pagamento foi verificado (em produção, seria via API bancária)
    verifiedPayments.add(orderId)

    console.log("[v0] Pagamento verificado para pedido:", orderId)

    return NextResponse.json({
      success: true,
      message: "Pagamento confirmado com sucesso!",
      orderId,
    })
  } catch (error) {
    console.error("[v0] Erro ao verificar pagamento:", error)
    return NextResponse.json({ error: "Erro ao verificar pagamento" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId
    const isVerified = verifiedPayments.has(orderId)

    return NextResponse.json({
      success: true,
      isVerified,
      orderId,
    })
  } catch (error) {
    console.error("[v0] Erro ao verificar status:", error)
    return NextResponse.json({ error: "Erro ao verificar status" }, { status: 500 })
  }
}
