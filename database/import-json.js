/*
 * Copia as contas e pedidos dos arquivos JSON de desenvolvimento (.data/users.json e
 * .data/orders.json) para o MySQL. Pode rodar mais de uma vez: registros com o mesmo id
 * são atualizados, não duplicados.
 *
 *   node database/import-json.js [mysql://root@127.0.0.1:3306/kairos]
 *
 * Sem argumento, usa DATABASE_URL ou mysql://root@127.0.0.1:3306/kairos.
 */
const fs = require("fs")
const path = require("path")
const mysql = require("mysql2/promise")

const url = process.argv[2] || process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/kairos"
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", ".data")

async function main() {
  const conn = await mysql.createConnection(url)
  try {
    for (const table of ["users", "orders"]) {
      const file = path.join(dataDir, `${table}.json`)
      if (!fs.existsSync(file)) {
        console.log(`${table}: ${file} não existe, pulando`)
        continue
      }
      const docs = JSON.parse(fs.readFileSync(file, "utf8"))
      for (const doc of docs) {
        await conn.query(
          `INSERT INTO ${table} (id, created_at, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)`,
          [doc.id, doc.createdAt, JSON.stringify(doc)],
        )
      }
      console.log(`${table}: ${docs.length} registro(s) importado(s)`)
    }
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
