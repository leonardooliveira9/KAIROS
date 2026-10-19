import "server-only"
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

// Confere o ID token emitido pelo Firebase Auth sem precisar de conta de serviço:
// assinatura pelas chaves públicas do Google + emissor/público do projeto.
// Docs: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
)

/** O token precisa ter sido gerado por um login recente (evita reaproveitar tokens antigos) */
const MAX_AUTH_AGE_SECONDS = 10 * 60

export interface FirebaseClaims extends JWTPayload {
  sub: string
  auth_time: number
  email?: string
  email_verified?: boolean
  name?: string
  phone_number?: string
  firebase: { sign_in_provider: string; identities?: Record<string, string[]> }
}

export function firebaseProjectId() {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""
}

export const firebaseEnabled = () => Boolean(firebaseProjectId() && process.env.NEXT_PUBLIC_FIREBASE_API_KEY)

export async function verifyFirebaseIdToken(idToken: string, provider: "google.com" | "phone") {
  const projectId = firebaseProjectId()
  if (!projectId) throw new Error("Firebase não configurado")
  if (typeof idToken !== "string" || idToken.length > 4096) throw new Error("Token inválido")

  const { payload } = await jwtVerify(idToken, JWKS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  })
  const claims = payload as FirebaseClaims
  const now = Math.floor(Date.now() / 1000)
  if (!claims.sub) throw new Error("Token sem usuário")
  if (typeof claims.auth_time !== "number" || claims.auth_time > now + 60 || now - claims.auth_time > MAX_AUTH_AGE_SECONDS) {
    throw new Error("Login expirado, tente de novo")
  }
  if (claims.firebase?.sign_in_provider !== provider) throw new Error("Método de login inesperado")
  return claims
}
