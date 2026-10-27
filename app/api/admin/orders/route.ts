import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireRole, sameOrigin } from "@/lib/server/auth"
import { getOrder, listOrders, updateOrder, type Order } from "@/lib/server/orders-store"
import { notifyOrder } from "@/lib/server/order-emails"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, "admin")
  if (auth instanceof NextResponse) return auth
  return NextResponse.json({ orders: await listOrders() })
}

const patchSchema = z.object({
  orderId: z.string().max(20),
  status: z.enum(["awaiting_payment", "paid", "shipped", "canceled"]).optional(),
  trackingCode: z.string().trim().max(40).optional(),
})

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = await requireRole(request, "admin")
  if (auth instanceof NextResponse) return auth

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  const { orderId, status, trackingCode } = parsed.data

  const order = await getOrder(orderId)
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

  const patch: Partial<Order> = {}
  if (trackingCode !== undefined) patch.trackingCode = trackingCode || undefined
  if (status && status !== order.status) {
    patch.status = status
    // mudança manual: o pedido deixa de ser um "PIX expirado" automático
    patch.canceledReason = undefined
    const now = new Date().toISOString()
    if (status === "paid" && !order.paidAt) patch.paidAt = now
    if (status === "shipped") {
      patch.shippedAt = now
      if (!order.paidAt) patch.paidAt = now
    }
  }

  const updated = await updateOrder(orderId, patch)
  if (updated) {
    // avisa o cliente: pagamento confirmado à mão, envio, ou rastreio informado depois do envio
    if (patch.status === "paid") notifyOrder(updated, "paid")
    else if (patch.status === "shipped") notifyOrder(updated, "shipped")
    else if (updated.status === "shipped" && updated.trackingCode && updated.trackingCode !== order.trackingCode) {
      notifyOrder(updated, "shipped")
    }
  }
  return NextResponse.json({ order: updated })
}
