import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"
import { currentUser } from "@/lib/server/auth"

export const metadata: Metadata = { title: "Painel", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect("/entrar?next=/admin")

  if (user.role !== "admin") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </span>
        <h1 className="mt-5 font-serif text-3xl">Acesso restrito</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Sua conta não tem permissão de administrador. Se isso for um engano, peça a um admin para liberar seu acesso.
        </p>
        <Link href="/conta" className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          Ir para minha conta
        </Link>
      </main>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <AdminNav name={user.name} />
      {children}
    </div>
  )
}
