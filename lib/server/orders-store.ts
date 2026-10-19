import "server-only"
import crypto from "crypto"
import fs from "fs"
import path from "path"

export type OrderStatus = "awaiting_payment" | "paid" | "shipped" | "canceled"

export interface OrderItem {
  slug: string
  name: string
  price: number
  quantity: number
  image: string
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

/*
 * Armazenamento simples: memória + arquivo JSON (DATA_DIR, padrão ".data").
 * Funciona em servidor próprio/VPS e em desenvolvimento.
 * TODO: na Vercel o disco não é persistente — troque por um banco (Postgres/Supabase/Neon)
 * implementando as mesmas funções abaixo.
 */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data")
const FILE = path.join(DATA_DIR, "orders.json")

type Store = { orders: Map<string, Order>; loaded: boolean }
const g = globalThis as unknown as { __kairosOrders?: Store }
const store: Store = (g.__kairosOrders ??= { orders: new Map(), loaded: false })

function load() {
  if (store.loaded) return
  store.loaded = true
  try {
    const raw = fs.readFileSync(FILE, "utf8")
    for (const order of JSON.parse(raw) as Order[]) store.orders.set(order.id, order)
  } catch {
    // primeiro uso ou disco indisponível
  }
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify([...store.orders.values()], null, 2))
  } catch (err) {
    console.warn("[orders] não foi possível gravar em disco; pedidos ficam só na memória", err)
  }
}

export function newOrderId() {
  // 8 caracteres sem ambiguidades (sem 0/O, 1/I) — difícil de adivinhar
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.randomBytes(8)
  let id = ""
  for (const b of bytes) id += alphabet[b % alphabet.length]
  return `KRS-${id}`
}

export function saveOrder(order: Order) {
  load()
  store.orders.set(order.id, order)
  persist()
  return order
}

export function getOrder(id: string) {
  load()
  return store.orders.get(id)
}

export function listOrders() {
  load()
  return [...store.orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function updateOrder(id: string, patch: Partial<Order>) {
  const order = getOrder(id)
  if (!order) return undefined
  const updated = { ...order, ...patch }
  store.orders.set(id, updated)
  persist()
  return updated
}

export function markPaid(id: string) {
  const order = getOrder(id)
  if (!order || order.status !== "awaiting_payment") return order
  return updateOrder(id, { status: "paid", paidAt: new Date().toISOString() })
}

export function findByChargeId(chargeId: string) {
  load()
  return [...store.orders.values()].find((o) => o.payment.chargeId === chargeId)
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
export function listOrdersForUser(userId: string, verifiedEmail?: string) {
  load()
  const email = verifiedEmail?.trim().toLowerCase()
  return [...store.orders.values()]
    .filter((o) => o.userId === userId || (!o.userId && !!email && o.customer.email.toLowerCase() === email))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
