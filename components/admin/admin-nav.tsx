"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ExternalLink, LogOut, Package, ShoppingBag, TicketPercent, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin/pedidos", label: "Pedidos", icon: Package },
  { href: "/admin/produtos", label: "Produtos", icon: ShoppingBag },
  { href: "/admin/cupons", label: "Cupons", icon: TicketPercent },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
]

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const signOut = async () => {
    await logout()
    router.replace("/")
    router.refresh()
  }

  return (
    <header className="border-b border-border/70 bg-card">
      <div className="container-k flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/admin" className="font-serif text-lg">
            <span className="text-gold">†</span> Kairos <span className="text-xs text-muted-foreground">admin</span>
          </Link>
          <nav aria-label="Painel" className="flex min-w-0 gap-1 overflow-x-auto">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
                  pathname.startsWith(href) ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" /> <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground md:inline">{name}</span>
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm sm:inline-flex">
            Ver loja <ExternalLink className="size-3.5" />
          </Link>
          <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground">
            <LogOut className="size-3.5" /> Sair
          </button>
        </div>
      </div>
    </header>
  )
}
