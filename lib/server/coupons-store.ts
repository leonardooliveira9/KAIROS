import "server-only"
import { normalizeCode, todayInBrazil, type Coupon } from "@/lib/coupons"
import { formatBRL } from "@/lib/format"
import { allDocs, deleteDoc, getDoc, insertDoc, putDoc } from "./db"

// Cupons criados no admin (tabela coupons; o id é o código)

export function listCoupons() {
  return allDocs<Coupon>("coupons")
}

export function getCoupon(code: string) {
  return getDoc<Coupon>("coupons", normalizeCode(code))
}

/** Lança DuplicateError se o código já existir */
export function createCoupon(data: Omit<Coupon, "id" | "uses" | "createdAt">) {
  const code = normalizeCode(data.code)
  return insertDoc<Coupon>("coupons", { ...data, code, id: code, uses: 0, createdAt: new Date().toISOString() })
}

export async function updateCoupon(code: string, patch: Partial<Omit<Coupon, "id" | "code" | "createdAt">>) {
  const current = await getCoupon(code)
  if (!current) return undefined
  return putDoc<Coupon>("coupons", { ...current, ...patch })
}

export function deleteCoupon(code: string) {
  return deleteDoc("coupons", normalizeCode(code))
}

/**
 * Confere se o cupom vale para uma compra com este subtotal de produtos.
 * Devolve o cupom ou a mensagem para o cliente.
 */
export async function checkCoupon(code: string, subtotal: number): Promise<{ coupon: Coupon } | { error: string }> {
  const coupon = code ? await getCoupon(code) : undefined
  if (!coupon || !coupon.active) return { error: "Cupom inválido." }
  if (coupon.expiresOn && todayInBrazil() > coupon.expiresOn) return { error: "Este cupom expirou." }
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) return { error: "Este cupom já atingiu o limite de usos." }
  if (subtotal < coupon.minSubtotal) {
    return { error: `Este cupom vale para compras a partir de ${formatBRL(coupon.minSubtotal)} em produtos.` }
  }
  return { coupon }
}

/** Conta um uso (chamado quando a compra com o cupom é paga) */
export async function redeemCoupon(code: string) {
  const coupon = await getCoupon(code)
  if (coupon) await putDoc<Coupon>("coupons", { ...coupon, uses: coupon.uses + 1 })
}
