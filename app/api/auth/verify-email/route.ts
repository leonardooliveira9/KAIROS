import { NextResponse, type NextRequest } from "next/server"
import { consumeVerifyToken, toPublicUser } from "@/lib/server/users-store"
import { sameOrigin } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Link do e-mail: confirma e leva para uma página com o resultado
export async function GET(request: NextRequest) {
  const user = await consumeVerifyToken(request.nextUrl.searchParams.get("token") ?? "")
  const url = new URL(`/verificar-email?status=${user ? "ok" : "invalido"}`, request.nextUrl.origin)
  return NextResponse.redirect(url, 303)
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const body = await request.json().catch(() => null)
  const user = await consumeVerifyToken(typeof body?.token === "string" ? body.token : "")
  if (!user) return NextResponse.json({ error: "Link inválido ou expirado. Peça um novo em Minha conta." }, { status: 400 })
  return NextResponse.json({ user: toPublicUser(user) })
}
