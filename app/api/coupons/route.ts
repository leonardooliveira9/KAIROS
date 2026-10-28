import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { clientIp } from "@/lib/server/auth"
import { checkCoupon } from "@/lib/server/coupons-store"
import { takeRateLimit } from "@/lib/server/rate-limit"

export const runtime = "nodejs"

const schema = z.object({ code: z.string().trim().min(1).max(30), subtotal: z.number().min(0).max(1_000_000) })

// Confere um cupom digitado no checkout. O checkout confere de novo ao gerar o PIX.
export async function POST(request: NextRequest) {
  // contra tentativa e erro de códigos: 20 consultas por IP a cada 10 minutos
  if (!takeRateLimit(`coupon:ip:${clientIp(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Digite o cupom." }, { status: 400 })

  const checked = await checkCoupon(parsed.data.code, parsed.data.subtotal)
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 422 })
  const { code, kind, value } = checked.coupon
  return NextResponse.json({ coupon: { code, kind, value } })
}
