import { NextResponse, type NextRequest } from "next/server"
import {
  adminConfigured,
  clearFailures,
  clientIp,
  createSessionToken,
  isLockedOut,
  recordFailure,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  verifyPassword,
} from "@/lib/server/auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Painel não configurado: defina ADMIN_PASSWORD_HASH e SESSION_SECRET (veja .env.example)." },
      { status: 503 },
    )
  }

  const ip = clientIp(request)
  if (isLockedOut(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 15 minutos." }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const password = typeof body.password === "string" ? body.password : ""

  if (!password || !verifyPassword(password)) {
    recordFailure(ip)
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400))
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 })
  }

  clearFailures(ip)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })
  return response
}
