import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AccountDashboard } from "@/components/auth/account-dashboard"
import { currentUser } from "@/lib/server/auth"

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function ContaPage() {
  const user = await currentUser()
  if (!user) redirect("/entrar?next=/conta")
  return <AccountDashboard />
}
