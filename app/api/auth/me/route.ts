import { NextResponse, type NextRequest } from "next/server"
import { fieldErrors, profileSchema } from "@/lib/validation"
import { toPublicUser, updateUser } from "@/lib/server/users-store"
import { requestUser, requireRole, sameOrigin } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const user = requestUser(request)
  return NextResponse.json({ user: user ? toPublicUser(user) : null })
}

// Atualiza nome e CPF. O telefone só muda pela verificação por SMS (/api/auth/phone).
export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = requireRole(request)
  if (auth instanceof NextResponse) return auth

  const parsed = profileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  const updated = updateUser(auth.id, {
    name: parsed.data.name,
    cpf: parsed.data.cpf || undefined,
  })
  return NextResponse.json({ user: updated ? toPublicUser(updated) : null })
}
