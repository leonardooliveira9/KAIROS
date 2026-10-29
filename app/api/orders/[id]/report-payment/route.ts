import { NextResponse, type NextRequest } from "next/server"
import { requireRole, sameOrigin } from "@/lib/server/auth"
import { notifyStorePaymentReported } from "@/lib/server/order-emails"
import { getOrder, updateIfAwaiting } from "@/lib/server/orders-store"

export const runtime = "nodejs"

/*
 * "Já fiz o PIX" (PIX estático). O pedido NÃO vira pago aqui: só fica marcado para a loja conferir
 * no banco e confirmar no admin. Avisa a loja por e-mail uma única vez.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = await requireRole(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const order = await getOrder(id)
  // só o dono do pedido pode avisar
  if (!order || order.userId !== auth.id) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
  if (order.status !== "awaiting_payment" || order.payment.provider !== "static_pix") {
    return NextResponse.json({ status: order.status, reportedPaidAt: order.customerReportedPaidAt ?? null })
  }
  if (order.customerReportedPaidAt) {
    return NextResponse.json({ status: order.status, reportedPaidAt: order.customerReportedPaidAt })
  }

  const { order: updated, changed } = await updateIfAwaiting(id, { customerReportedPaidAt: new Date().toISOString() })
  if (changed && updated) notifyStorePaymentReported(updated)
  return NextResponse.json({ status: updated?.status ?? order.status, reportedPaidAt: updated?.customerReportedPaidAt ?? null })
}
