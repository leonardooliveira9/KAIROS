import { NextResponse, type NextRequest } from "next/server"
import { getOrder, markPaid } from "@/lib/server/orders-store"
import { simulatePixPayment } from "@/lib/server/abacatepay"
import { syncPayment } from "@/lib/server/payment-sync"

export const runtime = "nodejs"

// Simula a confirmação bancária — SOMENTE para testes.
// PIX estático: bloqueado em produção. AbacatePay: só funciona com chave sandbox (devMode).
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = getOrder(id)
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

  if (order.payment.provider === "abacatepay") {
    if (!order.payment.devMode || !order.payment.chargeId) {
      return NextResponse.json({ error: "Simulação indisponível" }, { status: 403 })
    }
    try {
      await simulatePixPayment(order.payment.chargeId)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Falha na simulação" }, { status: 502 })
    }
    const synced = await syncPayment(order, { force: true })
    return NextResponse.json({ status: synced.status })
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Simulação indisponível" }, { status: 403 })
  }
  const updated = markPaid(id)
  return NextResponse.json({ status: updated?.status })
}
