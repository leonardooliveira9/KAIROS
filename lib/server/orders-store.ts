import "server-only"
import crypto from "crypto"
import type { CustomRosary } from "@/lib/customizer"
import { allDocs, findDocs, getDoc, putDoc } from "./db"

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
  shippedAt?: string
  trackingCode?: string
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

export async function markPaid(id: string) {
  const order = await getOrder(id)
  if (!order || order.status !== "awaiting_payment") return order
  return updateOrder(id, { status: "paid", paidAt: new Date().toISOString() })
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
    shippedAt: order.shippedAt ?? null,
    trackingCode: order.trackingCode ?? null,
    firstName: order.customer.fullName.split(" ")[0],
    city: `${order.address.city} / ${order.address.state}`,
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
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
