import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const { paymentId } = params

    // Em produção, seria verificado via webhook do banco
    return NextResponse.json({
      success: true,
      paymentId,
      status: "confirmed",
      message: "Pagamento confirmado com sucesso",
      confirmedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Erro ao confirmar pagamento:", error)
    return NextResponse.json({ error: "Erro ao confirmar pagamento" }, { status: 500 })
  }
}
