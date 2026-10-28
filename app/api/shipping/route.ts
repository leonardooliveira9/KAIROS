import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { clientIp } from "@/lib/server/auth"
import { takeRateLimit } from "@/lib/server/rate-limit"
import { quoteShipping, ShippingError } from "@/lib/server/shipping"

export const runtime = "nodejs"

const schema = z.object({
  cep: z.string().max(12),
  quantity: z.number().int().min(1).max(400),
})

// Cotação do frete (PAC e SEDEX) para o CEP do cliente, usada no checkout
export async function POST(request: NextRequest) {
  // cada cotação consulta o Melhor Envio: 40 por IP a cada 10 minutos
  if (!takeRateLimit(`shipping:ip:${clientIp(request)}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas consultas de frete. Aguarde alguns minutos." }, { status: 429 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Informe o CEP." }, { status: 400 })

  try {
    return NextResponse.json({ quotes: await quoteShipping(parsed.data.cep, parsed.data.quantity) })
  } catch (err) {
    if (err instanceof ShippingError) return NextResponse.json({ error: err.message }, { status: 422 })
    console.error("[shipping]", err)
    return NextResponse.json({ error: "Não conseguimos calcular o frete agora." }, { status: 500 })
  }
}
