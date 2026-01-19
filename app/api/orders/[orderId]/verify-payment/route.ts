import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { orders } from "../../orders/route"

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = orders[params.orderId]

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      paidAt: order.paidAt ?? null,
    })
  } catch (error) {
    console.error("[PAYMENT STATUS] Erro:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao consultar pagamento" },
      { status: 500 }
    )
  }
}
