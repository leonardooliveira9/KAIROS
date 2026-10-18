// Gera o valor de ADMIN_PASSWORD_HASH para o painel administrativo.
// Uso: node scripts/generate-password-hash.js "sua-senha-forte"
const crypto = require("crypto")

const password = process.argv[2]
if (!password || password.length < 10) {
  console.error('Uso: node scripts/generate-password-hash.js "senha-com-10-ou-mais-caracteres"')
  process.exit(1)
}

const salt = crypto.randomBytes(16)
const hash = crypto.scryptSync(password, salt, 64)
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}`)
console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString("hex")}`)
