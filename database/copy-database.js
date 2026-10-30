/*
 * Copia contas, pedidos, produtos e cupons de um MySQL para outro (ex.: da Aiven para o TiDB Cloud).
 * Pode rodar mais de uma vez: registros com o mesmo id são atualizados, não duplicados.
 * Não apaga nada no banco de origem.
 *
 * Crie o arquivo KAIROS/.env.migracao (o git ignora) com:
 *   ORIGEM_DATABASE_URL=mysql://avnadmin:SENHA@host-da-aiven:PORTA/defaultdb
 *   ORIGEM_DATABASE_CA=C:\caminho\para\ca.pem        (o certificado da Aiven; opcional)
 *   DESTINO_DATABASE_URL=mysql://USUARIO:SENHA@host-do-tidb:4000/kairos
 * e rode, na pasta KAIROS:
 *   node database/copy-database.js
 */
const fs = require("fs")
const path = require("path")
const mysql = require("mysql2/promise")

const TABLES = ["users", "orders", "products", "coupons"]

function readEnvFile() {
  const file = path.join(__dirname, "..", ".env.migracao")
  if (!fs.existsSync(file)) throw new Error(`Crie o arquivo ${file} (veja as instruções no topo deste script).`)
  const env = {}
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
  return env
}

/** Conexão com TLS fora do computador local (Aiven e TiDB exigem); tira o ?ssl-mode que o mysql2 não entende */
function connect(rawUrl, caPath) {
  const url = new URL(rawUrl)
  url.searchParams.delete("ssl-mode")
  url.searchParams.delete("sslmode")
  const local = ["127.0.0.1", "localhost"].includes(url.hostname)
  const ssl = local
    ? undefined
    : caPath
      ? { minVersion: "TLSv1.2", ca: fs.readFileSync(caPath, "utf8") }
      : { minVersion: "TLSv1.2" }
  return mysql.createConnection({ uri: url.toString(), ssl })
}

/** Mesmas tabelas que lib/server/db.ts cria */
async function createTables(conn) {
  for (const table of TABLES) {
    const emailColumn =
      table === "users"
        ? `email VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.email'))) STORED,
        UNIQUE KEY users_email (email),`
        : ""
    await conn.query(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        created_at VARCHAR(32) NOT NULL,
        data LONGTEXT NOT NULL,
        ${emailColumn}
        KEY ${table}_created (created_at)
      ) DEFAULT CHARSET=utf8mb4`,
    )
  }
}

async function main() {
  const env = readEnvFile()
  if (!env.ORIGEM_DATABASE_URL || !env.DESTINO_DATABASE_URL) {
    throw new Error("Preencha ORIGEM_DATABASE_URL e DESTINO_DATABASE_URL no .env.migracao")
  }
  const from = await connect(env.ORIGEM_DATABASE_URL, env.ORIGEM_DATABASE_CA)
  const to = await connect(env.DESTINO_DATABASE_URL, env.DESTINO_DATABASE_CA)
  try {
    await createTables(to)
    for (const table of TABLES) {
      let rows
      try {
        ;[rows] = await from.query(`SELECT id, created_at, data FROM ${table}`)
      } catch (err) {
        if (err.code === "ER_NO_SUCH_TABLE") {
          console.log(`${table}: não existe na origem, pulando`)
          continue
        }
        throw err
      }
      for (const row of rows) {
        await to.query(
          `INSERT INTO ${table} (id, created_at, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)`,
          [row.id, row.created_at, row.data],
        )
      }
      const [[{ total }]] = await to.query(`SELECT COUNT(*) AS total FROM ${table}`)
      console.log(`${table}: ${rows.length} copiado(s) • destino tem ${total}`)
    }
    console.log("Pronto. Agora troque o DATABASE_URL na Vercel e faça o Redeploy.")
  } finally {
    await from.end()
    await to.end()
  }
}

main().catch((err) => {
  console.error("Erro:", err.message)
  process.exit(1)
})
