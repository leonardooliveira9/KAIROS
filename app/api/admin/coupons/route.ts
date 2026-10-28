import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireRole, sameOrigin } from "@/lib/server/auth"
import { DuplicateError } from "@/lib/server/db"
import { createCoupon, deleteCoupon, getCoupon, listCoupons, updateCoupon } from "@/lib/server/coupons-store"
import { couponSchema, fieldErrors } from "@/lib/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function guard(request: NextRequest, write = true) {
  if (write && !sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = await requireRole(request, "admin")
  return auth instanceof NextResponse ? auth : null
}

export async function GET(request: NextRequest) {
  const denied = await guard(request, false)
  if (denied) return denied
  return NextResponse.json({ coupons: await listCoupons() })
}

// Novo cupom
export async function POST(request: NextRequest) {
  const denied = await guard(request)
  if (denied) return denied
  const parsed = couponSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados do cupom.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  try {
    return NextResponse.json({ coupon: await createCoupon(parsed.data) }, { status: 201 })
  } catch (err) {
    if (err instanceof DuplicateError) {
      const message = "Já existe um cupom com este código."
      return NextResponse.json({ error: message, fields: { code: message } }, { status: 409 })
    }
    throw err
  }
}

const patchSchema = z.object({ code: z.string().max(30), active: z.boolean() })

// Liga/desliga um cupom (para mudar regras, apague e crie outro: quem já usou continua com o antigo)
export async function PATCH(request: NextRequest) {
  const denied = await guard(request)
  if (denied) return denied
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  const coupon = await updateCoupon(parsed.data.code, { active: parsed.data.active })
  if (!coupon) return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 })
  return NextResponse.json({ coupon })
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request)
  if (denied) return denied
  const code = request.nextUrl.searchParams.get("code") ?? ""
  if (!(await getCoupon(code))) return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 })
  await deleteCoupon(code)
  return NextResponse.json({ ok: true })
}
