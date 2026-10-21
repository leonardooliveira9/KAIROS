import "server-only"
import crypto from "crypto"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { getUser, type Role, type User } from "./users-store"

export const SESSION_COOKIE = "kairos_session"
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 dias, em segundos

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function sessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ausente ou curto (mínimo 32 caracteres). Veja .env.example")
  }
  return secret
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url")
}

/** Token assinado e sem estado: { uid, v (versão da sessão), exp } */
export function createSessionToken(user: User) {
  const payload = Buffer.from(
    JSON.stringify({ uid: user.id, v: user.sessionVersion, exp: Date.now() + SESSION_MAX_AGE * 1000 }),
  ).toString("base64url")
  return `${payload}.${sign(payload)}`
}

/** Valida o token e devolve o usuário atual (o papel é lido do cadastro, nunca do cookie) */
export async function userFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null
  let claims: { uid: string; v: number; exp: number }
  try {
    const expected = Buffer.from(sign(payload))
    const given = Buffer.from(signature)
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null
    claims = JSON.parse(Buffer.from(payload, "base64url").toString())
  } catch {
    return null
  }
  if (typeof claims.exp !== "number" || claims.exp < Date.now()) return null
  // fora do try: falha do banco vira erro 500, não um "deslogado" falso (que causava loop de login)
  const user = await getUser(claims.uid)
  if (!user || user.sessionVersion !== claims.v) return null
  return user
}

export function setSessionCookie(response: NextResponse, user: User) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })
  return response
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}

/** Para rotas de API */
export function requestUser(request: NextRequest) {
  return userFromToken(request.cookies.get(SESSION_COOKIE)?.value)
}

/** Para Server Components / layouts */
export async function currentUser() {
  return userFromToken((await cookies()).get(SESSION_COOKIE)?.value)
}

/**
 * Exige login (e opcionalmente um papel) numa rota de API.
 * Uso: const auth = await requireRole(request, "admin"); if (auth instanceof NextResponse) return auth
 */
export async function requireRole(request: NextRequest, role?: Role) {
  const user = await requestUser(request)
  if (!user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 })
  if (role && user.role !== role) return NextResponse.json({ error: "Sem permissão." }, { status: 403 })
  return user
}

/** Bloqueia POST/PATCH vindos de outro site (defesa extra além do SameSite=Lax) */
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  return !origin || origin === request.nextUrl.origin
}

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "local"
  )
}

// Limite de tentativas de login por IP + e-mail (memória da instância)
const attempts = new Map<string, { count: number; since: number }>()

export function isLockedOut(key: string) {
  const a = attempts.get(key)
  if (!a) return false
  if (Date.now() - a.since > LOCKOUT_MS) {
    attempts.delete(key)
    return false
  }
  return a.count >= MAX_ATTEMPTS
}

export function recordFailure(key: string) {
  const a = attempts.get(key)
  if (!a || Date.now() - a.since > LOCKOUT_MS) attempts.set(key, { count: 1, since: Date.now() })
  else a.count++
}

export function clearFailures(key: string) {
  attempts.delete(key)
}
