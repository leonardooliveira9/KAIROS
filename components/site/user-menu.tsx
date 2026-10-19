"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn, LogOut, Package, Search, ShieldCheck, UserRound } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"

export function UserMenu() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  const triggerClass =
    "ml-1 hidden size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-85 sm:inline-flex"

  if (loading || !user) {
    return (
      <Link href="/entrar" aria-label="Entrar na minha conta" title="Entrar" className={triggerClass}>
        <UserRound className="size-4" />
      </Link>
    )
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")

  const signOut = async () => {
    await logout()
    router.push("/")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Menu da minha conta" className={`${triggerClass} text-xs font-semibold`}>
        {initials || <UserRound className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/conta">
            <Package className="size-4" /> Meus pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pedido">
            <Search className="size-4" /> Acompanhar pedido
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck className="size-4 text-gold" /> Painel admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Links da conta para o menu móvel */
export function useAccountLinks() {
  const { user } = useAuth()
  if (!user) return [{ href: "/entrar", label: "Entrar / Criar conta", icon: LogIn }]
  const links = [{ href: "/conta", label: "Minha conta", icon: UserRound }]
  if (user.role === "admin") links.push({ href: "/admin", label: "Painel admin", icon: ShieldCheck })
  return links
}
