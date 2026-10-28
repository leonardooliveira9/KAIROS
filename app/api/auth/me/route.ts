import { NextResponse, type NextRequest } from "next/server"
import { fieldErrors, profileSchema } from "@/lib/validation"
import { toPublicUser, updateUser } from "@/lib/server/users-store"
import { requestUser, requireRole, sameOrigin } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const user = await requestUser(request)
  return NextResponse.json({ user: user ? toPublicUser(user) : null })
}

// Atualiza nome, CPF e celular (WhatsApp de contato)
export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = await requireRole(request)
  if (auth instanceof NextResponse) return auth

  const parsed = profileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  const updated = await updateUser(auth.id, {
    name: parsed.data.name,
    cpf: parsed.data.cpf || undefined,
    phone: parsed.data.phone || undefined,
  })
  return NextResponse.json({ user: updated ? toPublicUser(updated) : null })
}
