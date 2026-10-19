import "server-only"
import crypto from "crypto"
import fs from "fs"
import path from "path"

export type Role = "admin" | "customer"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  phone?: string
  cpf?: string
  createdAt: string
  /** Muda ao trocar senha ou papel: invalida sessões antigas */
  sessionVersion: number
  /** Preenchido quando o dono confirma o e-mail pelo link enviado */
  emailVerifiedAt?: string
  /** Tokens de e-mail: guardamos só o SHA-256; o token em si vai apenas no link */
  emailVerifyTokenHash?: string
  emailVerifyExpiresAt?: number
  passwordResetTokenHash?: string
  passwordResetExpiresAt?: number
  /** Conta Google ligada (uid do Firebase); contas só-Google ficam com passwordHash vazio */
  googleUid?: string
  /** Preenchido quando o telefone em `phone` foi confirmado por SMS */
  phoneVerifiedAt?: string
}

type SecretField =
  | "passwordHash"
  | "sessionVersion"
  | "emailVerifyTokenHash"
  | "emailVerifyExpiresAt"
  | "passwordResetTokenHash"
  | "passwordResetExpiresAt"
  | "googleUid"

export type PublicUser = Omit<User, SecretField> & { hasPassword: boolean; googleLinked: boolean }

/*
 * Mesmo esquema dos pedidos: memória + arquivo JSON em DATA_DIR (padrão ".data").
 * TODO: na Vercel o disco não é persistente — mova para o mesmo banco dos pedidos.
 */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data")
const FILE = path.join(DATA_DIR, "users.json")

type Store = { users: Map<string, User>; loaded: boolean }
const g = globalThis as unknown as { __kairosUsers?: Store }
const store: Store = (g.__kairosUsers ??= { users: new Map(), loaded: false })

function load() {
  if (store.loaded) return
  store.loaded = true
  try {
    for (const u of JSON.parse(fs.readFileSync(FILE, "utf8")) as User[]) store.users.set(u.id, u)
  } catch {
    // primeiro uso
  }
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify([...store.users.values()], null, 2))
  } catch (err) {
    console.warn("[users] não foi possível gravar em disco; contas ficam só na memória", err)
  }
}

/**
 * E-mails em ADMIN_EMAILS (separados por vírgula) viram admin ao se cadastrar — mas só enquanto
 * a loja ainda não tem nenhum admin. Como o e-mail não é verificado, isso evita que alguém
 * crie depois uma conta com um desses e-mails e ganhe acesso. Demais admins: /admin/usuarios.
 */
function bootstrapAdmins() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64)
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`
}

// hash fixo para gastar o mesmo tempo quando o e-mail não existe (não revela quais e-mails têm conta)
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString("hex"))

export function verifyPassword(password: string, stored: string | undefined) {
  const [algo, saltHex, hashHex] = (stored ?? DUMMY_HASH).split(":")
  if (algo !== "scrypt" || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length)
  return crypto.timingSafeEqual(actual, expected) && stored !== undefined
}

export function getUser(id: string) {
  load()
  return store.users.get(id)
}

export function findUserByEmail(email: string) {
  load()
  const e = email.trim().toLowerCase()
  return [...store.users.values()].find((u) => u.email === e)
}

export function listUsers() {
  load()
  return [...store.users.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createUser(input: { name: string; email: string; password: string }) {
  load()
  const email = input.email.trim().toLowerCase()
  if (findUserByEmail(email)) return null
  const user: User = {
    id: `usr_${crypto.randomBytes(9).toString("base64url")}`,
    name: input.name.trim(),
    email,
    passwordHash: hashPassword(input.password),
    role: countAdmins() === 0 && bootstrapAdmins().has(email) ? "admin" : "customer",
    createdAt: new Date().toISOString(),
    sessionVersion: 1,
  }
  store.users.set(user.id, user)
  persist()
  return user
}

export function updateUser(id: string, patch: Partial<Omit<User, "id" | "email" | "createdAt">>) {
  const user = getUser(id)
  if (!user) return undefined
  const updated = { ...user, ...patch }
  store.users.set(id, updated)
  persist()
  return updated
}

export function countAdmins() {
  load()
  return [...store.users.values()].filter((u) => u.role === "admin").length
}

export function toPublicUser(user: User): PublicUser {
  const {
    passwordHash: _p,
    sessionVersion: _v,
    emailVerifyTokenHash: _evt,
    emailVerifyExpiresAt: _eve,
    passwordResetTokenHash: _prt,
    passwordResetExpiresAt: _pre,
    googleUid: _g,
    ...rest
  } = user
  return { ...rest, hasPassword: Boolean(user.passwordHash), googleLinked: Boolean(user.googleUid) }
}

/** Conta pronta para comprar: e-mail e telefone confirmados */
export function isFullyVerified(user: User) {
  return Boolean(user.emailVerifiedAt && user.phoneVerifiedAt && user.phone)
}

export function findUserByGoogleUid(uid: string) {
  load()
  return [...store.users.values()].find((u) => u.googleUid === uid)
}

export function findUserByVerifiedPhone(phone: string) {
  load()
  return [...store.users.values()].find((u) => u.phone === phone && u.phoneVerifiedAt)
}

/**
 * Login com Google. O Google já confirmou que a pessoa é dona do e-mail, então:
 * - conta ligada a este uid: entra;
 * - conta existente com o mesmo e-mail: liga o Google e marca o e-mail como verificado.
 *   Se esse e-mail ainda NÃO estava verificado, a conta pode ter sido criada por outra pessoa
 *   usando o e-mail alheio: a senha antiga é apagada e todas as sessões são encerradas;
 * - nenhuma conta: cria uma conta só-Google (sem senha).
 */
export function upsertGoogleUser(input: { uid: string; email: string; name: string }) {
  load()
  const now = new Date().toISOString()
  const byUid = findUserByGoogleUid(input.uid)
  if (byUid) return byUid

  const email = input.email.trim().toLowerCase()
  const existing = findUserByEmail(email)
  if (existing) {
    const wasVerified = Boolean(existing.emailVerifiedAt)
    return updateUser(existing.id, {
      googleUid: input.uid,
      emailVerifiedAt: existing.emailVerifiedAt ?? now,
      emailVerifyTokenHash: undefined,
      emailVerifyExpiresAt: undefined,
      ...(wasVerified ? {} : { passwordHash: "", sessionVersion: existing.sessionVersion + 1 }),
    })!
  }

  const user: User = {
    id: `usr_${crypto.randomBytes(9).toString("base64url")}`,
    name: input.name.trim() || email.split("@")[0],
    email,
    passwordHash: "",
    role: countAdmins() === 0 && bootstrapAdmins().has(email) ? "admin" : "customer",
    createdAt: now,
    sessionVersion: 1,
    googleUid: input.uid,
    emailVerifiedAt: now,
  }
  store.users.set(user.id, user)
  persist()
  return user
}

// --- Tokens de verificação de e-mail e de redefinição de senha ---------------

export type TokenPurpose = "verify" | "reset"

const TOKEN_TTL: Record<TokenPurpose, number> = {
  verify: 24 * 60 * 60 * 1000, // 24 h
  reset: 60 * 60 * 1000, // 1 h
}

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex")

const fields = (purpose: TokenPurpose) =>
  purpose === "verify"
    ? ({ hash: "emailVerifyTokenHash", exp: "emailVerifyExpiresAt" } as const)
    : ({ hash: "passwordResetTokenHash", exp: "passwordResetExpiresAt" } as const)

/** Gera um token novo (o anterior deixa de valer) e devolve o valor em claro para o link */
export function issueToken(userId: string, purpose: TokenPurpose) {
  const token = crypto.randomBytes(32).toString("base64url")
  const f = fields(purpose)
  updateUser(userId, { [f.hash]: hashToken(token), [f.exp]: Date.now() + TOKEN_TTL[purpose] })
  return token
}

/** Usuário dono de um token ainda válido (não consome o token) */
export function findByToken(token: string, purpose: TokenPurpose) {
  if (!token || token.length > 200) return undefined
  load()
  const f = fields(purpose)
  const hash = hashToken(token)
  const user = [...store.users.values()].find((u) => u[f.hash] === hash)
  if (!user || (user[f.exp] ?? 0) < Date.now()) return undefined
  return user
}

/** Confirma o e-mail. Uso único: o token é apagado */
export function consumeVerifyToken(token: string) {
  const user = findByToken(token, "verify")
  if (!user) return undefined
  return updateUser(user.id, {
    emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
    emailVerifyTokenHash: undefined,
    emailVerifyExpiresAt: undefined,
  })
}

/**
 * Troca a senha a partir do link de recuperação. Uso único; encerra todas as sessões.
 * Quem abriu o link provou ter acesso à caixa de entrada, então o e-mail também fica verificado.
 */
export function resetPasswordWithToken(token: string, newPassword: string) {
  const user = findByToken(token, "reset")
  if (!user) return undefined
  return updateUser(user.id, {
    passwordHash: hashPassword(newPassword),
    sessionVersion: user.sessionVersion + 1,
    passwordResetTokenHash: undefined,
    passwordResetExpiresAt: undefined,
    emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
    emailVerifyTokenHash: undefined,
    emailVerifyExpiresAt: undefined,
  })
}
