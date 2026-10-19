import { NextResponse, type NextRequest } from "next/server"
import { changePasswordSchema, fieldErrors } from "@/lib/validation"
import { hashPassword, updateUser, verifyPassword } from "@/lib/server/users-store"
import { requireRole, sameOrigin, setSessionCookie } from "@/lib/server/auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = await requireRole(request)
  if (auth instanceof NextResponse) return auth

  const parsed = changePasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  if (auth.passwordHash && !verifyPassword(parsed.data.currentPassword, auth.passwordHash)) {
    return NextResponse.json({ error: "Senha atual incorreta.", fields: { currentPassword: "Senha atual incorreta" } }, { status: 400 })
  }

  // nova versão de sessão: desconecta os outros aparelhos e mantém este logado
  const updated = (await updateUser(auth.id, {
    passwordHash: hashPassword(parsed.data.newPassword),
    sessionVersion: auth.sessionVersion + 1,
  }))!
  return setSessionCookie(NextResponse.json({ ok: true }), updated)
}
