import "server-only"
import { storeConfig } from "@/lib/store-config"
import type { ShippingQuote, ShippingService } from "@/lib/shipping"

/*
 * Frete dos Correios (PAC e SEDEX) cotado pelo Melhor Envio.
 * Docs: https://docs.menv.io/ — POST /api/v2/me/shipment/calculate
 * - MELHOR_ENVIO_TOKEN: token da conta (Melhor Envio > Integrações > Permissões de acesso, com "shipping-calculate");
 * - MELHOR_ENVIO_SANDBOX=true: usa o ambiente de testes (o token precisa ser do sandbox).
 * Sem token ou sem storeConfig.shipping.originCep, cobra o frete reserva (storeConfig.shipping.fallback).
 */

/** Ids dos serviços dos Correios no Melhor Envio */
const SERVICE_IDS: Record<number, ShippingService> = { 1: "pac", 2: "sedex" }

export class ShippingError extends Error {}

const cache = new Map<string, { at: number; quotes: ShippingQuote[] }>()
const CACHE_MS = 10 * 60 * 1000

function melhorEnvio() {
  const token = process.env.MELHOR_ENVIO_TOKEN
  const origin = storeConfig.shipping.originCep.replace(/\D/g, "")
  if (!token || origin.length !== 8) return null
  const sandbox = process.env.MELHOR_ENVIO_SANDBOX === "true"
  return { token, origin, url: `https://${sandbox ? "sandbox." : ""}melhorenvio.com.br/api/v2/me/shipment/calculate` }
}

/** Caixa dos Correios para `quantity` terços */
function packageFor(quantity: number) {
  const p = storeConfig.shipping.package
  return {
    width: p.width,
    length: p.length,
    height: Math.min(p.maxHeight, p.baseHeight + p.heightPerItem * (quantity - 1)),
    weight: Math.round((p.baseWeightKg + p.weightPerItemKg * quantity) * 1000) / 1000,
  }
}

/**
 * Opções de entrega para o CEP, da mais barata para a mais cara. O preço sempre é calculado aqui no
 * servidor — o checkout cota de novo e nunca usa o valor que veio do navegador.
 */
export async function quoteShipping(cep: string, quantity: number): Promise<ShippingQuote[]> {
  const to = cep.replace(/\D/g, "")
  if (to.length !== 8) throw new ShippingError("CEP inválido")
  if (quantity < 1) throw new ShippingError("Sacola vazia")

  const api = melhorEnvio()
  if (!api) {
    console.warn("[frete] Melhor Envio não configurado (MELHOR_ENVIO_TOKEN / originCep); usando o frete reserva")
    const { price, days } = storeConfig.shipping.fallback
    return [{ service: "pac", name: "PAC", price, days }]
  }

  const key = `${to}:${quantity}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.quotes

  const res = await fetch(api.url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${api.token}`,
      // o Melhor Envio exige um User-Agent com nome do app e e-mail de contato
      "User-Agent": `${storeConfig.name} (${storeConfig.contact.email})`,
    },
    body: JSON.stringify({
      from: { postal_code: api.origin },
      to: { postal_code: to },
      package: packageFor(quantity),
      options: { insurance_value: storeConfig.unitPrice * quantity, receipt: false, own_hand: false },
      services: Object.keys(SERVICE_IDS).join(","),
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((err) => {
    console.error("[frete] Melhor Envio sem resposta", err)
    throw new ShippingError("Não conseguimos calcular o frete agora. Tente de novo em instantes.")
  })

  const data = (await res.json().catch(() => null)) as unknown
  if (!res.ok || !Array.isArray(data)) {
    console.error("[frete] Melhor Envio respondeu", res.status, JSON.stringify(data)?.slice(0, 500))
    throw new ShippingError("Não conseguimos calcular o frete agora. Tente de novo em instantes.")
  }

  const quotes: ShippingQuote[] = []
  for (const option of data as Record<string, unknown>[]) {
    const service = SERVICE_IDS[Number(option.id)]
    // serviço que não atende o CEP vem com "error" e sem preço
    const price = Number(option.custom_price ?? option.price)
    const days = Number(option.custom_delivery_time ?? option.delivery_time)
    if (!service || option.error || !Number.isFinite(price) || price <= 0 || !Number.isFinite(days)) continue
    quotes.push({
      service,
      name: service === "pac" ? "PAC" : "SEDEX",
      price: Math.round(price * 100) / 100,
      days: days + storeConfig.shipping.handlingDays,
    })
  }
  if (quotes.length === 0) throw new ShippingError("Os Correios não entregam neste CEP. Confira o número.")
  quotes.sort((a, b) => a.price - b.price)

  cache.set(key, { at: Date.now(), quotes })
  return quotes
}
