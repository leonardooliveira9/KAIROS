import "server-only"
import type { NextRequest } from "next/server"
import { issueToken, type User } from "./users-store"
import { sendActionEmail, siteUrl } from "./mailer"

export async function sendVerificationEmail(request: NextRequest, user: User) {
  const token = await issueToken(user.id, "verify")
  return sendActionEmail({
    to: user.email,
    subject: "Confirme seu e-mail — Kairos",
    intro: `Olá, ${user.name.split(" ")[0]}! Confirme que este e-mail é seu para ver todos os seus pedidos na sua conta.`,
    actionLabel: "Confirmar e-mail",
    actionUrl: `${siteUrl(request)}/api/auth/verify-email?token=${token}`,
    footer: "O link vale por 24 horas. Se você não criou uma conta na Kairos, ignore esta mensagem.",
  })
}

export async function sendPasswordResetEmail(request: NextRequest, user: User) {
  const token = await issueToken(user.id, "reset")
  return sendActionEmail({
    to: user.email,
    subject: "Redefinir sua senha — Kairos",
    intro: `Olá, ${user.name.split(" ")[0]}! Recebemos um pedido para redefinir a senha da sua conta.`,
    actionLabel: "Criar nova senha",
    actionUrl: `${siteUrl(request)}/redefinir-senha?token=${token}`,
    footer: "O link vale por 1 hora e só pode ser usado uma vez. Se não foi você, ignore — sua senha continua a mesma.",
  })
}
