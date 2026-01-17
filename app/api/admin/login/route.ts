import { type NextRequest, NextResponse } from "next/server"
import {
  isIpBlocked,
  recordLoginAttempt,
  clearLoginAttempts,
  createSession,
  verifyPassword,
  hashPassword,
} from "@/lib/auth-utils"

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || hashPassword("21122005Nat")

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    if (isIpBlocked(ip)) {
      return NextResponse.json(
        { error: "Acesso temporariamente indisponível. Tente novamente mais tarde." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      recordLoginAttempt(ip)
      return NextResponse.json({ error: "Senha inválida" }, { status: 401 })
    }

    const isValid = verifyPassword(password, ADMIN_PASSWORD_HASH)

    if (!isValid) {
      recordLoginAttempt(ip)
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 })
    }

    clearLoginAttempts(ip)
    const sessionToken = createSession(ip, userAgent)

    const response = NextResponse.json({ success: true, message: "Login realizado com sucesso" }, { status: 200 })

    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/admin",
    })

    return response
  } catch (error) {
    console.error("[v0] Erro ao fazer login:", error)
    return NextResponse.json({ error: "Erro ao processar login" }, { status: 500 })
  }
}
