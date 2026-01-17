import { type NextRequest, NextResponse } from "next/server"
import { invalidateSession } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("admin_session")?.value

    if (sessionToken) {
      invalidateSession(sessionToken)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete("admin_session")

    return response
  } catch (error) {
    console.error("[v0] Erro ao fazer logout:", error)
    return NextResponse.json({ error: "Erro ao fazer logout" }, { status: 500 })
  }
}
