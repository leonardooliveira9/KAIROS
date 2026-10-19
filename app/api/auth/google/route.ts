import { NextResponse, type NextRequest } from "next/server"
import { clientIp, sameOrigin, setSessionCookie } from "@/lib/server/auth"
import { firebaseEnabled, verifyFirebaseIdToken } from "@/lib/server/firebase-token"
import { takeRateLimit } from "@/lib/server/rate-limit"
import { toPublicUser, upsertGoogleUser } from "@/lib/server/users-store"

export const runtime = "nodejs"

// Recebe o ID token do Firebase (login com Google feito no navegador) e abre a sessão da loja
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  if (!firebaseEnabled()) return NextResponse.json({ error: "Login com Google indisponível." }, { status: 503 })
  if (!takeRateLimit(`google:ip:${clientIp(request)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  try {
    const claims = await verifyFirebaseIdToken(body.idToken, "google.com")
    if (!claims.email || claims.email_verified !== true) {
      return NextResponse.json({ error: "Sua conta Google não tem e-mail verificado." }, { status: 400 })
    }
    const user = await upsertGoogleUser({ uid: claims.sub, email: claims.email, name: claims.name ?? "" })
    return setSessionCookie(NextResponse.json({ user: toPublicUser(user) }), user)
  } catch (err) {
    console.warn("[auth/google]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Não foi possível entrar com o Google. Tente de novo." }, { status: 401 })
  }
}
