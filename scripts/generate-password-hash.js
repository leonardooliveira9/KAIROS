import crypto from "crypto"

const SESSION_SECRET = "kairos-secret-key-change-in-production"
const PASSWORD = "21122005Nat"

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password + SESSION_SECRET)
    .digest("hex")
}

const hash = hashPassword(PASSWORD)
console.log("Hash para a senha '21122005Nat':")
console.log(hash)
