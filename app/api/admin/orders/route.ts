import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { isAdminRequest } from "@/lib/server/auth"
import { getOrder, listOrders, updateOrder, type Order } from "@/lib/server/orders-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  return NextResponse.json({ orders: listOrders() })
}

const patchSchema = z.object({
  orderId: z.string().max(20),
  status: z.enum(["awaiting_payment", "paid", "shipped", "canceled"]).optional(),
  trackingCode: z.string().trim().max(40).optional(),
})

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  const { orderId, status, trackingCode } = parsed.data

  const order = getOrder(orderId)
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

  const patch: Partial<Order> = {}
  if (trackingCode !== undefined) patch.trackingCode = trackingCode || undefined
  if (status && status !== order.status) {
    patch.status = status
    const now = new Date().toISOString()
    if (status === "paid" && !order.paidAt) patch.paidAt = now
    if (status === "shipped") {
      patch.shippedAt = now
      if (!order.paidAt) patch.paidAt = now
    }
  }

  return NextResponse.json({ order: updateOrder(orderId, patch) })
}
