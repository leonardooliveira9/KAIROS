import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { countAdmins, getUser, listUsers, toPublicUser, updateUser } from "@/lib/server/users-store"
import { listOrders } from "@/lib/server/orders-store"
import { requireRole, sameOrigin } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, "admin")
  if (auth instanceof NextResponse) return auth

  const orders = await listOrders()
  const users = (await listUsers()).map((u) => ({
    ...toPublicUser(u),
    ordersCount: orders.filter((o) => o.userId === u.id).length,
  }))
  return NextResponse.json({ users, currentUserId: auth.id })
}

const patchSchema = z.object({
  userId: z.string().max(40),
  role: z.enum(["admin", "customer"]),
})

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = await requireRole(request, "admin")
  if (auth instanceof NextResponse) return auth

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  const { userId, role } = parsed.data

  const target = await getUser(userId)
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  if (target.role === role) return NextResponse.json({ user: toPublicUser(target) })

  if (target.id === auth.id && role !== "admin") {
    return NextResponse.json({ error: "Você não pode remover o seu próprio acesso de admin." }, { status: 400 })
  }
  if (target.role === "admin" && (await countAdmins()) <= 1) {
    return NextResponse.json({ error: "A loja precisa ter pelo menos um admin." }, { status: 400 })
  }

  // muda a versão da sessão: o usuário afetado precisa entrar de novo
  const updated = (await updateUser(userId, { role, sessionVersion: target.sessionVersion + 1 }))!
  return NextResponse.json({ user: toPublicUser(updated) })
}
