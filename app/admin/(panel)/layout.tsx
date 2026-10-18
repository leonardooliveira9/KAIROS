import type React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { isValidSession, SESSION_COOKIE } from "@/lib/server/auth"

export const metadata: Metadata = { title: "Painel", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  let ok = false
  try {
    ok = isValidSession(token)
  } catch {
    ok = false
  }
  if (!ok) redirect("/admin/login")
  return <div className="min-h-dvh bg-background">{children}</div>
}
