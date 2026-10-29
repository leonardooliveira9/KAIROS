import { NextResponse, type NextRequest } from "next/server"
import { getOrder } from "@/lib/server/orders-store"
import { syncPayment } from "@/lib/server/payment-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Usado pelo checkout para saber se o PIX caiu. Retorna só o status.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

  const current = await syncPayment(order)
  return NextResponse.json({
    status: current.status,
    paidAt: current.paidAt ?? null,
    reportedPaidAt: current.customerReportedPaidAt ?? null,
  })
}
