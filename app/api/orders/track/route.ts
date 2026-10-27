import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getOrder, publicOrder } from "@/lib/server/orders-store"
import { syncPayment } from "@/lib/server/payment-sync"
import { clientIp } from "@/lib/server/auth"
import { takeRateLimit } from "@/lib/server/rate-limit"

export const runtime = "nodejs"

const schema = z.object({
  orderId: z.string().trim().toUpperCase().max(20),
  email: z.string().trim().toLowerCase().email(),
})

// Acompanhar pedido: exige número + e-mail usado na compra
export async function POST(request: NextRequest) {
  // limite contra tentativa e erro de número/e-mail: 30 consultas por IP a cada 10 minutos
  if (!takeRateLimit(`track:ip:${clientIp(request)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas consultas. Aguarde alguns minutos." }, { status: 429 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Informe o número do pedido e o e-mail." }, { status: 400 })

  const order = await getOrder(parsed.data.orderId)
  if (!order || order.customer.email !== parsed.data.email) {
    return NextResponse.json({ error: "Não encontramos um pedido com esses dados." }, { status: 404 })
  }
  const current = await syncPayment(order)
  return NextResponse.json({ order: publicOrder(current) })
}
