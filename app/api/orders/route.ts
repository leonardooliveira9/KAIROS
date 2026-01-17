import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Simular um banco de dados em memória
export const orders: Record<
  string,
  {
    id: string
    clientName: string
    email: string
    phone: string
    cpf: string
    address: string
    city: string
    state: string
    zipCode: string
    observations: string
    items: Array<{ id: string; name: string; quantity: number; price: number }>
    total: number
    pixKey: string
    qrCode: string
    status: "pending" | "paid" | "confirmed"
    createdAt: string
    paidAt?: string
  }
> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const orderId = `ORD-${Date.now()}`

    const order = {
      id: orderId,
      clientName: body.fullName,
      email: body.email,
      phone: body.phone,
      cpf: body.cpf,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      observations: body.observations,
      items: body.items,
      total: body.total,
      pixKey: "bac475e5-88ef-4402-8e5b-dde1a7cc5474",
      qrCode: body.qrCode,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    }

    orders[orderId] = order
    console.log("[v0] Pedido criado:", orderId, order)

    return NextResponse.json({
      success: true,
      orderId,
      pixKey: order.pixKey,
      qrCode: order.qrCode,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar pedido:", error)
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "orderId é necessário" }, { status: 400 })
    }

    const order = orders[orderId]

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar pedido:", error)
    return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 })
  }
}
