import { after, NextResponse, type NextRequest } from "next/server"
import { fieldErrors, registerSchema } from "@/lib/validation"
import { createUser, toPublicUser } from "@/lib/server/users-store"
import { clientIp, sameOrigin, setSessionCookie } from "@/lib/server/auth"
import { sendVerificationEmail } from "@/lib/server/account-emails"
import { allowEmailSend, takeRateLimit } from "@/lib/server/rate-limit"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })

  const parsed = registerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }

  // até 10 tentativas de cadastro por IP por hora (conta também e-mails já cadastrados,
  // o que dificulta descobrir quem tem conta)
  const ip = clientIp(request)
  if (!takeRateLimit(`register:ip:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitos cadastros a partir desta rede. Tente mais tarde." }, { status: 429 })
  }

  const user = await createUser(parsed.data)
  if (!user) {
    return NextResponse.json(
      { error: "Já existe uma conta com este e-mail.", fields: { email: "E-mail já cadastrado. Tente entrar." } },
      { status: 409 },
    )
  }

  // envio em segundo plano: se falhar, o cliente pode pedir de novo em /conta
  if (allowEmailSend("verify", ip, user.email)) after(() => sendVerificationEmail(request, user))
  return setSessionCookie(NextResponse.json({ user: toPublicUser(user) }, { status: 201 }), user)
}
