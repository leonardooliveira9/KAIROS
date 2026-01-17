import crypto from "crypto"

const SESSION_SECRET = process.env.SESSION_SECRET || "kairos-secret-key-change-in-production"
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutos

// Storage para rastrear tentativas de login (em produção usar Redis)
const loginAttempts = new Map<string, { count: number; timestamp: number }>()
const activeSessions = new Map<string, { createdAt: number; ip: string; userAgent: string }>()

export function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + SESSION_SECRET)
    .digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function isIpBlocked(ip: string): boolean {
  const attempt = loginAttempts.get(ip)
  if (!attempt) return false

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLast = Date.now() - attempt.timestamp
    if (timeSinceLast < LOCKOUT_TIME) {
      return true
    } else {
      loginAttempts.delete(ip)
      return false
    }
  }
  return false
}

export function recordLoginAttempt(ip: string): void {
  const attempt = loginAttempts.get(ip)
  if (attempt) {
    attempt.count++
    attempt.timestamp = Date.now()
  } else {
    loginAttempts.set(ip, { count: 1, timestamp: Date.now() })
  }
}

export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

export function createSession(ip: string, userAgent: string): string {
  const token = generateSessionToken()
  activeSessions.set(token, {
    createdAt: Date.now(),
    ip,
    userAgent,
  })
  return token
}

export function validateSession(token: string, ip: string, userAgent: string): boolean {
  const session = activeSessions.get(token)
  if (!session) return false

  // Validar IP e User-Agent (segurança adicional)
  if (session.ip !== ip || session.userAgent !== userAgent) {
    activeSessions.delete(token)
    return false
  }

  // Expirar após 24 horas
  const sessionAge = Date.now() - session.createdAt
  if (sessionAge > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token)
    return false
  }

  return true
}

export function invalidateSession(token: string): void {
  activeSessions.delete(token)
}
