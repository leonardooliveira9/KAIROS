import "server-only"
import crypto from "crypto"
import type { CustomRosary } from "@/lib/customizer"
import type { ShippingService } from "@/lib/shipping"
import { allDocs, findDocs, getDoc, putDoc, replaceDocIf } from "./db"
import { notifyOrder } from "./order-emails"
import { redeemCoupon } from "./coupons-store"

export type OrderStatus = "awaiting_payment" | "paid" | "shipped" | "canceled"

export interface OrderItem {
  slug: string
  name: string
  price: number
  quantity: number
  image: string
  /** Terço personalizado: escolhas e o resumo legível delas */
  custom?: CustomRosary
  details?: string
}

export interface Order {
  id: string
  createdAt: string
  status: OrderStatus
  customer: { fullName: string; email: string; phone: string; cpf: string }
  address: {
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    notes: string
  }
  /** Conta que fez o pedido (vazio = compra como visitante) */
  userId?: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  /** Serviço dos Correios escolhido e prazo cotado (pedidos antigos não têm) */
  shippingMethod?: { service: ShippingService; name: string; days: number }
  /** Desconto do cupom em R$ (produtos ou frete); total = subtotal + shipping - discount */
  discount?: number
  /** Cupom usado; `redeemed` = já contado no limite de usos (só quando o pedido é pago) */
  coupon?: { code: string; label: string; redeemed?: boolean }
  total: number
  payment: {
    provider: "abacatepay" | "static_pix"
    chargeId?: string
    devMode?: boolean
    brCode: string
    expiresAt: string
    lastCheckedAt?: number
  }
  paidAt?: string
  /** PIX estático: quando o cliente tocou em "Já fiz o PIX" (a loja confere no banco e confirma no admin) */
  customerReportedPaidAt?: string
  shippedAt?: string
  trackingCode?: string
  /** Cancelado automaticamente porque o PIX venceu sem pagamento (vazio = cancelado pelo admin) */
  canceledReason?: "payment_expired"
}

// Guardado pelo módulo db: MySQL (DATABASE_URL) ou arquivo JSON local em desenvolvimento

export function newOrderId() {
  // 8 caracteres sem ambiguidades (sem 0/O, 1/I) — difícil de adivinhar
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.randomBytes(8)
  let id = ""
  for (const b of bytes) id += alphabet[b % alphabet.length]
  return `KRS-${id}`
}

export function saveOrder(order: Order) {
  return putDoc("orders", order)
}

export function getOrder(id: string) {
  return getDoc<Order>("orders", id)
}

export function listOrders() {
  return allDocs<Order>("orders")
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  const order = await getOrder(id)
  if (!order) return undefined
  return putDoc("orders", { ...order, ...patch })
}

/**
 * Aplica `patch` só se o pedido ainda estiver esperando pagamento. Conferência e gravação são
 * atômicas: webhook e consultas simultâneas não confirmam o mesmo pagamento duas vezes nem
 * desfazem um pagamento já confirmado. Devolve o pedido e se foi esta chamada que mudou.
 */
export async function updateIfAwaiting(id: string, patch: Partial<Order>) {
  const order = await getOrder(id)
  if (!order || order.status !== "awaiting_payment") return { order, changed: false }
  const next = { ...order, ...patch }
  if (await replaceDocIf("orders", next, "status", "awaiting_payment")) return { order: next, changed: true }
  return { order: await getOrder(id), changed: false }
}

export async function markPaid(id: string) {
  const { order, changed } = await updateIfAwaiting(id, { status: "paid", paidAt: new Date().toISOString() })
  if (changed && order) {
    notifyOrder(order, "paid")
    return (await redeemOrderCoupon(order)) ?? order
  }
  return order
}

/** Conta o uso do cupom do pedido uma única vez, quando ele é pago */
export async function redeemOrderCoupon(order: Order) {
  if (!order.coupon || order.coupon.redeemed) return order
  await redeemCoupon(order.coupon.code)
  return updateOrder(order.id, { coupon: { ...order.coupon, redeemed: true } })
}

/** PIX venceu: cancela só se o pedido ainda estiver esperando pagamento (não desfaz um pagamento já confirmado) */
export async function markPaymentExpired(id: string) {
  return (await updateIfAwaiting(id, { status: "canceled", canceledReason: "payment_expired" })).order
}

export async function findByChargeId(chargeId: string) {
  return (await findDocs<Order>("orders", "payment.chargeId", chargeId))[0]
}

/** Dados que podem ser mostrados ao cliente (sem CPF, telefone ou endereço completo) */
export function publicOrder(order: Order) {
  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? null,
    reportedPaidAt: order.customerReportedPaidAt ?? null,
    shippedAt: order.shippedAt ?? null,
    trackingCode: order.trackingCode ?? null,
    firstName: order.customer.fullName.split(" ")[0],
    city: `${order.address.city} / ${order.address.state}`,
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    shippingMethod: order.shippingMethod ?? null,
    discount: order.discount ?? 0,
    couponCode: order.coupon?.code ?? null,
    total: order.total,
  }
}

/**
 * Pedidos feitos com a conta logada. Pedidos de visitante com o mesmo e-mail só entram quando
 * o e-mail da conta foi verificado (`verifiedEmail`) — senão alguém poderia se cadastrar com o
 * e-mail de outra pessoa e ver as compras dela.
 */
export async function listOrdersForUser(userId: string, verifiedEmail?: string) {
  const email = verifiedEmail?.trim().toLowerCase()
  const mine = await findDocs<Order>("orders", "userId", userId)
  const guest = email ? (await findDocs<Order>("orders", "customer.email", email)).filter((o) => !o.userId) : []
  return [...mine, ...guest].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
