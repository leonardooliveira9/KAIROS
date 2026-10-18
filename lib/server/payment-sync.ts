import "server-only"
import { checkPixCharge, PAID_STATUSES } from "./abacatepay"
import { getOrder, markPaid, updateOrder, type Order } from "./orders-store"

/**
 * Consulta a AbacatePay e atualiza o pedido. Nunca confia no navegador:
 * o pedido só vira "pago" quando a própria AbacatePay responde PAID.
 */
export async function syncPayment(order: Order, { force = false } = {}): Promise<Order> {
  if (order.status !== "awaiting_payment" || order.payment.provider !== "abacatepay" || !order.payment.chargeId) {
    return order
  }
  const now = Date.now()
  if (!force && order.payment.lastCheckedAt && now - order.payment.lastCheckedAt < 4000) return order

  updateOrder(order.id, { payment: { ...order.payment, lastCheckedAt: now } })
  try {
    const charge = await checkPixCharge(order.payment.chargeId)
    if (PAID_STATUSES.has(charge.status)) return markPaid(order.id) ?? order
    if (charge.status === "EXPIRED" || charge.status === "CANCELLED") {
      return updateOrder(order.id, { status: "canceled" }) ?? order
    }
  } catch (err) {
    console.error("[payment-sync]", order.id, err)
  }
  return getOrder(order.id) ?? order
}
