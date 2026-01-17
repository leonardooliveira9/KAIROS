import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { orders } from "@/app/api/orders/route"
import { validateSession } from "@/lib/auth-utils"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kairos123"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("admin_session")?.value
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    if (!sessionToken || !validateSession(sessionToken, ip, userAgent)) {
      return NextResponse.json({ error: "Acesso negado - Sessão inválida" }, { status: 401 })
    }

    const allOrders = Object.values(orders).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    console.log(`[ADMIN] GET /api/admin/orders - IP: ${ip} - Timestamp: ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      total: allOrders.length,
      orders: allOrders,
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar pedidos do admin:", error)
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("admin_session")?.value
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    if (!sessionToken || !validateSession(sessionToken, ip, userAgent)) {
      return NextResponse.json({ error: "Acesso negado - Sessão inválida" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, status } = body

    if (!orders[orderId]) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    orders[orderId].status = status
    if (status === "confirmed") {
      orders[orderId].paidAt = new Date().toISOString()
    }

    console.log(
      `[ADMIN] PATCH /api/admin/orders - OrderID: ${orderId} - NewStatus: ${status} - IP: ${ip} - Timestamp: ${new Date().toISOString()}`,
    )

    return NextResponse.json({
      success: true,
      order: orders[orderId],
    })
  } catch (error) {
    console.error("[v0] Erro ao atualizar pedido:", error)
    return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
  }
}
