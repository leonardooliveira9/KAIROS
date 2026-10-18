import "server-only"

// Checkout Transparente PIX da AbacatePay (API v2)
// Docs: https://docs.abacatepay.com/pages/transparents/reference
const BASE_URL = "https://api.abacatepay.com/v2"

export const abacatePayEnabled = () => Boolean(process.env.ABACATEPAY_API_KEY)

async function call<T>(pathAndQuery: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${pathAndQuery}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.success) {
    const message = body?.error || `HTTP ${res.status}`
    throw new Error(`AbacatePay: ${message}`)
  }
  return body.data as T
}

export interface PixCharge {
  id: string
  amount: number
  status: string
  devMode: boolean
  brCode: string
  brCodeBase64: string
  expiresAt: string
}

export function createPixCharge(input: {
  amountCents: number
  description: string
  expiresIn: number
  externalId: string
  customer: { name: string; email: string; cellphone: string; taxId: string }
}) {
  return call<PixCharge>("/transparents/create", {
    method: "POST",
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: input.amountCents,
        description: input.description,
        expiresIn: input.expiresIn,
        externalId: input.externalId,
        customer: input.customer,
        metadata: { orderId: input.externalId },
      },
    }),
  })
}

export function checkPixCharge(id: string) {
  return call<{ id: string; status: string; expiresAt: string }>(
    `/transparents/check?id=${encodeURIComponent(id)}`,
    { method: "GET" },
  )
}

/** Só funciona com chave de sandbox (devMode) */
export function simulatePixPayment(id: string) {
  return call<PixCharge>(`/transparents/simulate-payment?id=${encodeURIComponent(id)}`, {
    method: "POST",
  })
}

export const PAID_STATUSES = new Set(["PAID", "APPROVED", "REDEEMED"])
