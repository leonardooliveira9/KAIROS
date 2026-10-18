import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getOrder, publicOrder } from "@/lib/server/orders-store"
import { syncPayment } from "@/lib/server/payment-sync"

export const runtime = "nodejs"

const schema = z.object({
  orderId: z.string().trim().toUpperCase().max(20),
  email: z.string().trim().toLowerCase().email(),
})

// Acompanhar pedido: exige número + e-mail usado na compra
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Informe o número do pedido e o e-mail." }, { status: 400 })

  const order = getOrder(parsed.data.orderId)
  if (!order || order.customer.email !== parsed.data.email) {
    return NextResponse.json({ error: "Não encontramos um pedido com esses dados." }, { status: 404 })
  }
  const current = await syncPayment(order)
  return NextResponse.json({ order: publicOrder(current) })
}
