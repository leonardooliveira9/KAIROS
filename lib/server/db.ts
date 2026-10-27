import "server-only"
import fs from "fs"
import path from "path"
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise"

/*
 * Armazenamento de documentos (contas e pedidos).
 * - Com DATABASE_URL (mysql://usuario:senha@host:3306/banco): MySQL/MariaDB. Obrigatório na Vercel,
 *   onde cada requisição pode cair num servidor diferente e o disco não é persistente.
 * - Sem DATABASE_URL: memória + arquivo JSON em DATA_DIR (padrão ".data"), para desenvolvimento/VPS.
 *
 * Cada documento é guardado inteiro como JSON; buscas por campo usam JSON_EXTRACT.
 * O e-mail das contas tem índice único (coluna gerada a partir do JSON).
 */

export type Table = "users" | "orders"
type Doc = { id: string; createdAt: string }

export const databaseEnabled = () => Boolean(process.env.DATABASE_URL)

/** insertDoc: já existe um documento com o mesmo id ou o mesmo valor no campo único */
export class DuplicateError extends Error {}

// --- MySQL -------------------------------------------------------------------

const g = globalThis as unknown as {
  __kairosPool?: Promise<Pool>
  __kairosFiles?: Partial<Record<Table, Map<string, Doc>>>
}

async function createPool() {
  const mysql = await import("mysql2/promise")
  const ssl = process.env.DATABASE_SSL
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 3,
    // DATABASE_SSL=true para provedores que exigem TLS; "insecure" aceita certificado autoassinado
    ssl: ssl === "true" || ssl === "insecure" ? { minVersion: "TLSv1.2", rejectUnauthorized: ssl === "true" } : undefined,
  })
  for (const table of ["users", "orders"] satisfies Table[]) {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        created_at VARCHAR(32) NOT NULL,
        data LONGTEXT NOT NULL,
        KEY ${table}_created (created_at)
      ) DEFAULT CHARSET=utf8mb4`,
    )
  }
  await ensureUniqueEmail(pool)
  return pool
}

/** Coluna gerada users.email + índice único. Tabelas antigas ganham a coluna no primeiro uso. */
async function ensureUniqueEmail(pool: Pool) {
  try {
    await pool.query(
      `ALTER TABLE users
        ADD COLUMN email VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.email'))) STORED,
        ADD UNIQUE KEY users_email (email)`,
    )
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === "ER_DUP_FIELDNAME") return // já existe
    if (code === "ER_DUP_ENTRY") {
      console.error("[db] há contas com e-mail repetido; resolva no banco para ativar o índice único de e-mail")
      return
    }
    throw err
  }
}

function pool() {
  g.__kairosPool ??= createPool().catch((err) => {
    g.__kairosPool = undefined
    throw err
  })
  return g.__kairosPool
}

const parse = <T>(rows: RowDataPacket[]) => rows.map((r) => JSON.parse(r.data as string) as T)

// --- Arquivo JSON ----------------------------------------------------------------

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data")

function fileTable(table: Table) {
  const files = (g.__kairosFiles ??= {})
  let docs = files[table]
  if (!docs) {
    if (process.env.VERCEL) {
      console.error(
        "[db] DATABASE_URL não está definido na Vercel: contas e pedidos ficam só na memória de cada servidor e se perdem",
      )
    }
    docs = new Map()
    try {
      for (const d of JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${table}.json`), "utf8")) as Doc[]) docs.set(d.id, d)
    } catch {
      // primeiro uso
    }
    files[table] = docs
  }
  return docs
}

function persistFile(table: Table) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(path.join(DATA_DIR, `${table}.json`), JSON.stringify([...fileTable(table).values()], null, 2))
  } catch (err) {
    console.warn(`[db] não foi possível gravar ${table} em disco; dados ficam só na memória`, err)
  }
}

/** "payment.chargeId" → valor do campo aninhado */
function pick(doc: unknown, field: string) {
  return field.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], doc)
}

// --- API ---------------------------------------------------------------------------

export async function getDoc<T extends Doc>(table: Table, id: string): Promise<T | undefined> {
  if (!databaseEnabled()) return fileTable(table).get(id) as T | undefined
  const [rows] = await (await pool()).query<RowDataPacket[]>(`SELECT data FROM ${table} WHERE id = ?`, [id])
  return parse<T>(rows)[0]
}

/** Grava (cria ou substitui) pelo id. Para contas novas use insertDoc, que respeita o e-mail único. */
export async function putDoc<T extends Doc>(table: Table, doc: T): Promise<T> {
  if (!databaseEnabled()) {
    fileTable(table).set(doc.id, doc)
    persistFile(table)
    return doc
  }
  await (await pool()).query(
    `INSERT INTO ${table} (id, created_at, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)`,
    [doc.id, doc.createdAt, JSON.stringify(doc)],
  )
  return doc
}

/**
 * Substitui o documento só se `field` ainda tiver o valor `expected` no que está gravado.
 * Devolve false se outro processo mudou o campo antes (ex.: webhook e consulta marcando o mesmo pagamento).
 */
export async function replaceDocIf<T extends Doc>(table: Table, doc: T, field: string, expected: string): Promise<boolean> {
  if (!databaseEnabled()) {
    // sem await entre a conferência e a gravação: atômico dentro do processo
    const current = fileTable(table).get(doc.id)
    if (!current || pick(current, field) !== expected) return false
    fileTable(table).set(doc.id, doc)
    persistFile(table)
    return true
  }
  const [result] = await (await pool()).query<ResultSetHeader>(
    `UPDATE ${table} SET data = ? WHERE id = ? AND JSON_UNQUOTE(JSON_EXTRACT(data, ?)) = ?`,
    [JSON.stringify(doc), doc.id, `$.${field}`, expected],
  )
  return result.affectedRows > 0
}

/**
 * Cria um documento novo; nunca sobrescreve. Lança DuplicateError se o id já existir ou,
 * com `uniqueField`, se outro documento já tiver o mesmo valor nesse campo.
 * No MySQL a unicidade vem do índice (hoje só users.email); no arquivo, é conferida aqui.
 */
export async function insertDoc<T extends Doc>(table: Table, doc: T, uniqueField?: string): Promise<T> {
  if (!databaseEnabled()) {
    const docs = fileTable(table)
    const value = uniqueField ? pick(doc, uniqueField) : undefined
    if (docs.has(doc.id) || (uniqueField && [...docs.values()].some((d) => pick(d, uniqueField) === value))) {
      throw new DuplicateError(`${table}: documento duplicado`)
    }
    docs.set(doc.id, doc)
    persistFile(table)
    return doc
  }
  try {
    await (await pool()).query(`INSERT INTO ${table} (id, created_at, data) VALUES (?, ?, ?)`, [
      doc.id,
      doc.createdAt,
      JSON.stringify(doc),
    ])
  } catch (err) {
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") throw new DuplicateError(`${table}: documento duplicado`)
    throw err
  }
  return doc
}

/** Documentos em que `field` (pode ser aninhado: "customer.email") é igual a `value` */
export async function findDocs<T extends Doc>(table: Table, field: string, value: string): Promise<T[]> {
  if (!databaseEnabled()) {
    return [...fileTable(table).values()].filter((d) => pick(d, field) === value) as T[]
  }
  const [rows] = await (await pool()).query<RowDataPacket[]>(
    `SELECT data FROM ${table} WHERE JSON_UNQUOTE(JSON_EXTRACT(data, ?)) = ? ORDER BY created_at DESC`,
    [`$.${field}`, value],
  )
  return parse<T>(rows)
}

/** Todos os documentos, do mais novo para o mais antigo */
export async function allDocs<T extends Doc>(table: Table): Promise<T[]> {
  if (!databaseEnabled()) {
    return ([...fileTable(table).values()] as T[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  const [rows] = await (await pool()).query<RowDataPacket[]>(`SELECT data FROM ${table} ORDER BY created_at DESC`)
  return parse<T>(rows)
}
