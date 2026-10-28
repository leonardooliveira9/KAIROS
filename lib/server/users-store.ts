import "server-only"
import crypto from "crypto"
import { allDocs, DuplicateError, findDocs, getDoc, insertDoc, putDoc } from "./db"

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
  /** Legado: contas antigas confirmavam o celular por SMS; não é mais exigido */
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

// Guardado pelo módulo db: MySQL (DATABASE_URL) ou arquivo JSON local em desenvolvimento

/**
 * E-mails em ADMIN_EMAILS (separados por vírgula) viram admin quando o e-mail é CONFIRMADO
 * (link do e-mail, redefinição de senha ou login com Google) — e só enquanto a loja ainda não
 * tem nenhum admin. Assim ninguém vira admin só por cadastrar o e-mail de outra pessoa.
 * Demais admins: /admin/usuarios.
 */
function bootstrapAdmins() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

/** Papel da conta depois de o e-mail ter sido confirmado */
async function roleAfterVerification(user: Pick<User, "email" | "role">): Promise<Role> {
  if (user.role === "admin" || !bootstrapAdmins().has(user.email)) return user.role
  return (await countAdmins()) === 0 ? "admin" : user.role
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
  return getDoc<User>("users", id)
}

export async function findUserByEmail(email: string) {
  return (await findDocs<User>("users", "email", email.trim().toLowerCase()))[0]
}

export function listUsers() {
  return allDocs<User>("users")
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase()
  if (await findUserByEmail(email)) return null
  const user: User = {
    id: `usr_${crypto.randomBytes(9).toString("base64url")}`,
    name: input.name.trim(),
    email,
    passwordHash: hashPassword(input.password),
    // e-mail ainda não confirmado: nunca nasce admin (veja roleAfterVerification)
    role: "customer",
    createdAt: new Date().toISOString(),
    sessionVersion: 1,
  }
  try {
    // o banco garante e-mail único, mesmo com dois cadastros simultâneos
    return await insertDoc("users", user, "email")
  } catch (err) {
    if (err instanceof DuplicateError) return null
    throw err
  }
}

export async function updateUser(id: string, patch: Partial<Omit<User, "id" | "email" | "createdAt">>) {
  const user = await getUser(id)
  if (!user) return undefined
  return putDoc("users", { ...user, ...patch })
}

export async function countAdmins() {
  return (await findDocs<User>("users", "role", "admin")).length
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

/** Conta pronta para comprar: e-mail confirmado (o celular é só contato, informado no checkout) */
export function isFullyVerified(user: User) {
  return Boolean(user.emailVerifiedAt)
}

export async function findUserByGoogleUid(uid: string) {
  return (await findDocs<User>("users", "googleUid", uid))[0]
}

/**
 * Login com Google. O Google já confirmou que a pessoa é dona do e-mail, então:
 * - conta ligada a este uid: entra;
 * - conta existente com o mesmo e-mail: liga o Google e marca o e-mail como verificado.
 *   Se esse e-mail ainda NÃO estava verificado, a conta pode ter sido criada por outra pessoa
 *   usando o e-mail alheio: a senha antiga é apagada e todas as sessões são encerradas;
 * - nenhuma conta: cria uma conta só-Google (sem senha).
 */
export async function upsertGoogleUser(input: { uid: string; email: string; name: string }) {
  const now = new Date().toISOString()
  const byUid = await findUserByGoogleUid(input.uid)
  if (byUid) return byUid

  const email = input.email.trim().toLowerCase()
  const existing = await findUserByEmail(email)
  if (existing) {
    const wasVerified = Boolean(existing.emailVerifiedAt)
    return (await updateUser(existing.id, {
      googleUid: input.uid,
      role: await roleAfterVerification(existing),
      emailVerifiedAt: existing.emailVerifiedAt ?? now,
      emailVerifyTokenHash: undefined,
      emailVerifyExpiresAt: undefined,
      ...(wasVerified ? {} : { passwordHash: "", sessionVersion: existing.sessionVersion + 1 }),
    }))!
  }

  const user: User = {
    id: `usr_${crypto.randomBytes(9).toString("base64url")}`,
    name: input.name.trim() || email.split("@")[0],
    email,
    passwordHash: "",
    // o Google já confirmou o e-mail
    role: await roleAfterVerification({ email, role: "customer" }),
    createdAt: now,
    sessionVersion: 1,
    googleUid: input.uid,
    emailVerifiedAt: now,
  }
  try {
    return await insertDoc("users", user, "email")
  } catch (err) {
    // outra requisição criou a conta com este e-mail ao mesmo tempo: liga o Google a ela
    if (err instanceof DuplicateError) return upsertGoogleUser(input)
    throw err
  }
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
export async function issueToken(userId: string, purpose: TokenPurpose) {
  const token = crypto.randomBytes(32).toString("base64url")
  const f = fields(purpose)
  await updateUser(userId, { [f.hash]: hashToken(token), [f.exp]: Date.now() + TOKEN_TTL[purpose] })
  return token
}

/** Usuário dono de um token ainda válido (não consome o token) */
export async function findByToken(token: string, purpose: TokenPurpose) {
  if (!token || token.length > 200) return undefined
  const f = fields(purpose)
  const [user] = await findDocs<User>("users", f.hash, hashToken(token))
  if (!user || (user[f.exp] ?? 0) < Date.now()) return undefined
  return user
}

/** Confirma o e-mail. Uso único: o token é apagado */
export async function consumeVerifyToken(token: string) {
  const user = await findByToken(token, "verify")
  if (!user) return undefined
  return updateUser(user.id, {
    emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
    role: await roleAfterVerification(user),
    emailVerifyTokenHash: undefined,
    emailVerifyExpiresAt: undefined,
  })
}

/**
 * Troca a senha a partir do link de recuperação. Uso único; encerra todas as sessões.
 * Quem abriu o link provou ter acesso à caixa de entrada, então o e-mail também fica verificado.
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  const user = await findByToken(token, "reset")
  if (!user) return undefined
  return updateUser(user.id, {
    passwordHash: hashPassword(newPassword),
    sessionVersion: user.sessionVersion + 1,
    passwordResetTokenHash: undefined,
    passwordResetExpiresAt: undefined,
    emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
    role: await roleAfterVerification(user),
    emailVerifyTokenHash: undefined,
    emailVerifyExpiresAt: undefined,
  })
}
