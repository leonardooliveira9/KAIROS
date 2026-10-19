import { NextResponse, type NextRequest } from "next/server"
import { fieldErrors, registerSchema } from "@/lib/validation"
import { createUser, toPublicUser } from "@/lib/server/users-store"
import { clientIp, sameOrigin, setSessionCookie } from "@/lib/server/auth"
import { sendVerificationEmail } from "@/lib/server/account-emails"
import { allowEmailSend } from "@/lib/server/rate-limit"

export const runtime = "nodejs"

// no máximo 5 contas novas por IP por hora
const hits = new Map<string, number[]>()

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })

  const ip = clientIp(request)
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000)
  if (recent.length >= 5) {
    return NextResponse.json({ error: "Muitos cadastros a partir desta rede. Tente mais tarde." }, { status: 429 })
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }

  const user = createUser(parsed.data)
  if (!user) {
    return NextResponse.json(
      { error: "Já existe uma conta com este e-mail.", fields: { email: "E-mail já cadastrado. Tente entrar." } },
      { status: 409 },
    )
  }

  recent.push(now)
  hits.set(ip, recent)
  // envio em segundo plano: se falhar, o cliente pode pedir de novo em /conta
  if (allowEmailSend("verify", ip, user.email)) void sendVerificationEmail(request, user)
  return setSessionCookie(NextResponse.json({ user: toPublicUser(user) }, { status: 201 }), user)
}
