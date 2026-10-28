// Cupons de desconto: tipos e cálculo, usados igual no navegador e no servidor

import { formatBRL } from "./format"

/** percent: % sobre os produtos • fixed: valor em R$ sobre os produtos • shipping: frete grátis */
export type CouponKind = "percent" | "fixed" | "shipping"

export interface Coupon {
  /** O próprio código, em maiúsculas */
  id: string
  code: string
  kind: CouponKind
  /** % (1 a 100) ou R$; ignorado no frete grátis */
  value: number
  /** Subtotal mínimo dos produtos para valer (0 = sem mínimo) */
  minSubtotal: number
  /** Último dia de uso (AAAA-MM-DD, horário de Brasília); vazio = não expira */
  expiresOn: string | null
  /** Quantas compras pagas podem usar; vazio = sem limite */
  maxUses: number | null
  /** Compras pagas que já usaram */
  uses: number
  active: boolean
  createdAt: string
}

/** O que o navegador precisa saber de um cupom válido */
export type PublicCoupon = Pick<Coupon, "code" | "kind" | "value">

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "")

/** "10% nos produtos", "R$ 5,00 de desconto", "Frete grátis" */
export function couponLabel(c: Pick<Coupon, "kind" | "value">) {
  if (c.kind === "percent") return `${c.value}% de desconto nos produtos`
  if (c.kind === "fixed") return `${formatBRL(c.value)} de desconto`
  return "Frete grátis"
}

/** Desconto em R$ sobre o pedido (produtos e, no frete grátis, o frete) */
export function couponDiscount(c: Pick<Coupon, "kind" | "value">, subtotal: number, shipping: number) {
  const raw = c.kind === "percent" ? (subtotal * c.value) / 100 : c.kind === "fixed" ? Math.min(c.value, subtotal) : shipping
  return Math.round(raw * 100) / 100
}

/** Hoje no horário de Brasília (AAAA-MM-DD), para comparar com expiresOn */
export function todayInBrazil(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now)
}
