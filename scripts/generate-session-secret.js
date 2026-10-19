// Gera um valor aleatório para SESSION_SECRET (assina os cookies de login).
// Uso: node scripts/generate-session-secret.js
const crypto = require("crypto")
console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString("hex")}`)
