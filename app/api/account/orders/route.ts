import { NextResponse, type NextRequest } from "next/server"
import { listOrdersForUser, publicOrder } from "@/lib/server/orders-store"
import { requireRole } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = requireRole(request)
  if (auth instanceof NextResponse) return auth
  const orders = listOrdersForUser(auth.id, auth.emailVerifiedAt ? auth.email : undefined)
  return NextResponse.json({ orders: orders.map(publicOrder) })
}
