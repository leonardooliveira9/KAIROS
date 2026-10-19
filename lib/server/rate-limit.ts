import "server-only"

// Janela deslizante em memória (por instância). Chaves no formato "rota:ip:..." ou "rota:email:..."
// globalThis: sobrevive a recompilações do dev server, como os stores
const g = globalThis as unknown as { __kairosRateLimit?: Map<string, number[]> }
const hits = (g.__kairosRateLimit ??= new Map<string, number[]>())

/** Registra um uso e devolve false quando a chave já passou de `max` usos na janela */
export function takeRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

const HOUR = 60 * 60 * 1000

/**
 * Limite para envios de e-mail (verificação e recuperação de senha):
 * até 10 por hora por IP e 3 por hora por e-mail de destino.
 */
export function allowEmailSend(kind: string, ip: string, email: string) {
  if (!takeRateLimit(`${kind}:ip:${ip}`, 10, HOUR)) return false
  return takeRateLimit(`${kind}:email:${email.toLowerCase()}`, 3, HOUR)
}
