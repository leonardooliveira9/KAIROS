import "server-only"
import { findUserByVerifiedPhone, updateUser, type User } from "./users-store"

/** "+5561999990000" → "61999990000". Só aceitamos celulares do Brasil (onde a loja entrega). */
export function brazilianDigits(e164: string | undefined) {
  const m = /^\+55(\d{10,11})$/.exec(e164 ?? "")
  return m ? m[1] : null
}

export type PhoneResult = { ok: true; user: User } | { ok: false; error: string; status: number }

/** Grava o telefone confirmado na conta. Um número verificado só pode pertencer a uma conta. */
export async function markPhoneVerified(user: User, digits: string): Promise<PhoneResult> {
  const owner = await findUserByVerifiedPhone(digits)
  if (owner && owner.id !== user.id) {
    return { ok: false, error: "Este número já está confirmado em outra conta.", status: 409 }
  }
  const updated = (await updateUser(user.id, { phone: digits, phoneVerifiedAt: new Date().toISOString() }))!
  return { ok: true, user: updated }
}
