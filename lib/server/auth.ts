import "server-only"
import crypto from "crypto"
import type { NextRequest } from "next/server"

export const SESSION_COOKIE = "kairos_admin"
export const SESSION_MAX_AGE = 12 * 60 * 60 // 12 horas, em segundos

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function sessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ausente ou curto (mínimo 32 caracteres). Veja .env.example")
  }
  return secret
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET)
}

/** Formato do hash: scrypt:<salt hex>:<hash hex> — gere com `node scripts/generate-password-hash.js` */
export function verifyPassword(password: string) {
  const stored = process.env.ADMIN_PASSWORD_HASH ?? ""
  const [algo, saltHex, hashHex] = stored.split(":")
  if (algo !== "scrypt" || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length)
  return crypto.timingSafeEqual(actual, expected)
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url")
}

/** Token assinado e sem estado: funciona com várias instâncias do servidor */
export function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE * 1000, n: crypto.randomBytes(8).toString("hex") }),
  ).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function isValidSession(token: string | undefined) {
  if (!token) return false
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false
  try {
    const expected = Buffer.from(sign(payload))
    const given = Buffer.from(signature)
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString())
    return typeof exp === "number" && exp > Date.now()
  } catch {
    return false
  }
}

export function isAdminRequest(request: NextRequest) {
  return isValidSession(request.cookies.get(SESSION_COOKIE)?.value)
}

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "local"
  )
}

// Limite de tentativas por IP (memória da instância)
const attempts = new Map<string, { count: number; since: number }>()

export function isLockedOut(ip: string) {
  const a = attempts.get(ip)
  if (!a) return false
  if (Date.now() - a.since > LOCKOUT_MS) {
    attempts.delete(ip)
    return false
  }
  return a.count >= MAX_ATTEMPTS
}

export function recordFailure(ip: string) {
  const a = attempts.get(ip)
  if (!a || Date.now() - a.since > LOCKOUT_MS) attempts.set(ip, { count: 1, since: Date.now() })
  else a.count++
}

export function clearFailures(ip: string) {
  attempts.delete(ip)
}
