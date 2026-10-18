import crypto from "crypto"
import { NextResponse, type NextRequest } from "next/server"
import { findByChargeId, getOrder } from "@/lib/server/orders-store"
import { syncPayment } from "@/lib/server/payment-sync"

export const runtime = "nodejs"

/*
 * Webhook da AbacatePay. Cadastre a URL:
 *   https://SEU-DOMINIO/api/payment/webhook?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>
 * O conteúdo do evento é usado apenas para descobrir QUAL cobrança mudou;
 * o status é sempre reconfirmado direto na API da AbacatePay antes de marcar como pago.
 */
function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

function collectIds(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    if (/^pix_char_/.test(value) || /^KRS-[A-Z0-9]{8}$/.test(value)) out.add(value)
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectIds(v, out))
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectIds(v, out))
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET
  const given = request.nextUrl.searchParams.get("webhookSecret") ?? ""
  if (!secret || !safeEqual(given, secret)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const ids = new Set<string>()
  collectIds(body, ids)

  let updated = 0
  for (const id of ids) {
    const order = id.startsWith("KRS-") ? getOrder(id) : findByChargeId(id)
    if (!order) continue
    const synced = await syncPayment(order, { force: true })
    if (synced.status === "paid") updated++
  }

  return NextResponse.json({ received: true, updated })
}
