import { NextResponse, type NextRequest } from "next/server"
import { fieldErrors, resetPasswordSchema } from "@/lib/validation"
import { resetPasswordWithToken } from "@/lib/server/users-store"
import { clearFailures, clientIp, sameOrigin } from "@/lib/server/auth"
import { takeRateLimit } from "@/lib/server/rate-limit"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  if (!takeRateLimit(`reset-submit:ip:${clientIp(request)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 })
  }

  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }

  // incrementa sessionVersion: todas as sessões abertas (inclusive a de quem invadiu) caem
  const user = await resetPasswordWithToken(parsed.data.token, parsed.data.password)
  if (!user) {
    return NextResponse.json({ error: "Link inválido ou expirado. Peça um novo em Esqueci minha senha." }, { status: 400 })
  }
  clearFailures(`email:${user.email}`)
  return NextResponse.json({ ok: true })
}
