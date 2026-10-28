import { NextResponse } from "next/server"
import { listProducts, toProduct } from "@/lib/server/products-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Catálogo à venda, para a sacola e a busca no navegador
export async function GET() {
  const products = (await listProducts()).map(toProduct)
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } })
}
