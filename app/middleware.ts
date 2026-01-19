import { type NextRequest, NextResponse } from "next/server"

const PROTECTED_ROUTES = ["/admin/dashboard", "/admin/products"]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Verificar se a rota é protegida
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const sessionToken = request.cookies.get("admin_session")?.value

    if (!sessionToken) {
      console.log(`[v0] Acesso negado a ${pathname} - Sem sessão`)
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    console.log(`[v0] Acesso autorizado a ${pathname}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
