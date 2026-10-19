import { NextResponse, type NextRequest } from "next/server"
import { clientIp, requireRole, sameOrigin } from "@/lib/server/auth"
import { sendVerificationEmail } from "@/lib/server/account-emails"
import { allowEmailSend } from "@/lib/server/rate-limit"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = requireRole(request)
  if (auth instanceof NextResponse) return auth
  if (auth.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true })

  if (!allowEmailSend("verify", clientIp(request), auth.email)) {
    return NextResponse.json({ error: "Você já pediu vários e-mails. Tente novamente em 1 hora." }, { status: 429 })
  }
  if (!(await sendVerificationEmail(request, auth))) {
    return NextResponse.json({ error: "Não foi possível enviar o e-mail agora. Tente mais tarde." }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
