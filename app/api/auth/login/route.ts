import { NextResponse, type NextRequest } from "next/server"
import { loginSchema } from "@/lib/validation"
import { findUserByEmail, toPublicUser, verifyPassword } from "@/lib/server/users-store"
import { clearFailures, clientIp, isLockedOut, recordFailure, sameOrigin, setSessionCookie } from "@/lib/server/auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })

  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 })
  const { email, password } = parsed.data

  const ipKey = `ip:${clientIp(request)}`
  const emailKey = `email:${email}`
  if (isLockedOut(ipKey) || isLockedOut(emailKey)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 15 minutos." }, { status: 429 })
  }

  const user = findUserByEmail(email)
  // verifyPassword gasta o mesmo tempo mesmo se o e-mail não existir
  if (!verifyPassword(password, user?.passwordHash) || !user) {
    recordFailure(ipKey)
    recordFailure(emailKey)
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 })
  }

  clearFailures(ipKey)
  clearFailures(emailKey)
  return setSessionCookie(NextResponse.json({ user: toPublicUser(user) }), user)
}
