import { NextResponse, type NextRequest } from "next/server"
import { clientIp, requireRole, sameOrigin } from "@/lib/server/auth"
import { firebaseEnabled, verifyFirebaseIdToken } from "@/lib/server/firebase-token"
import { brazilianDigits, markPhoneVerified } from "@/lib/server/phone-verification"
import { takeRateLimit } from "@/lib/server/rate-limit"
import { toPublicUser } from "@/lib/server/users-store"

export const runtime = "nodejs"

/*
 * O código por SMS é enviado e conferido pelo Firebase no navegador.
 * Aqui recebemos o ID token resultante: ele só existe se o código estava certo,
 * e traz o número confirmado em `phone_number`.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = requireRole(request)
  if (auth instanceof NextResponse) return auth
  if (!firebaseEnabled()) return NextResponse.json({ error: "Verificação por SMS indisponível." }, { status: 503 })
  if (!takeRateLimit(`phone:ip:${clientIp(request)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  let phoneNumber: string | undefined
  try {
    phoneNumber = (await verifyFirebaseIdToken(body.idToken, "phone")).phone_number
  } catch (err) {
    console.warn("[auth/phone]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Não foi possível confirmar o código. Tente de novo." }, { status: 401 })
  }

  const digits = brazilianDigits(phoneNumber)
  if (!digits) return NextResponse.json({ error: "Use um celular do Brasil (+55)." }, { status: 400 })

  const result = markPhoneVerified(auth, digits)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ user: toPublicUser(result.user) })
}
