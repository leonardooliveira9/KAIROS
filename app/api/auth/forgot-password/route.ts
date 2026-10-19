import { NextResponse, type NextRequest } from "next/server"
import { forgotPasswordSchema } from "@/lib/validation"
import { findUserByEmail } from "@/lib/server/users-store"
import { clientIp, sameOrigin } from "@/lib/server/auth"
import { sendPasswordResetEmail } from "@/lib/server/account-emails"
import { allowEmailSend } from "@/lib/server/rate-limit"

export const runtime = "nodejs"

// Mesma resposta exista ou não a conta (não revela quais e-mails estão cadastrados)
const GENERIC = {
  ok: true,
  message: "Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha.",
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })

  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Informe um e-mail válido.", fields: { email: "E-mail inválido" } }, { status: 400 })
  const { email } = parsed.data

  // o limite vale também para e-mails sem conta, senão a diferença revelaria quem tem cadastro
  if (!allowEmailSend("reset", clientIp(request), email)) {
    return NextResponse.json({ error: "Muitos pedidos de redefinição. Tente novamente em 1 hora." }, { status: 429 })
  }

  const user = findUserByEmail(email)
  // não espera o envio: o tempo de resposta não pode denunciar se a conta existe
  if (user) void sendPasswordResetEmail(request, user)
  return NextResponse.json(GENERIC)
}
