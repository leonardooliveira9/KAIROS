"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"
import { Menu, Moon, Search, ShoppingBag, Sun, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useCart } from "@/contexts/cart-context"
import { cn } from "@/lib/utils"
import { Logo } from "./logo"
import { SearchDialog } from "./search-dialog"
import { UserMenu, useAccountLinks } from "./user-menu"

const links = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Terços" },
  { href: "/personalizar", label: "Personalize" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
]

function IconButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    />
  )
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true })
  return () => window.removeEventListener("scroll", onChange)
}

export function SiteHeader() {
  const pathname = usePathname()
  const { totalItems, setCartOpen, hydrated } = useCart()
  const { resolvedTheme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 8, () => false)
  const [bump, setBump] = useState(false)
  const accountLinks = useAccountLinks()

  // trocou de página: fecha o menu (ajuste feito durante o render, sem efeito extra)
  const [menuPath, setMenuPath] = useState(pathname)
  if (pathname !== menuPath) {
    setMenuPath(pathname)
    setMenuOpen(false)
  }

  // pequeno "pulo" no contador quando a quantidade da sacola muda
  const [seenTotal, setSeenTotal] = useState(totalItems)
  if (totalItems !== seenTotal) {
    setSeenTotal(totalItems)
    if (hydrated && totalItems > 0) setBump(true)
  }
  useEffect(() => {
    if (!bump) return
    const t = setTimeout(() => setBump(false), 350)
    return () => clearTimeout(t)
  }, [bump])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled ? "border-border/70 bg-background/85 backdrop-blur-md" : "border-transparent bg-background",
      )}
    >
      <div className="container-k flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full bg-secondary/80 p-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-full px-4 py-1.5 text-[13px] tracking-wide transition-colors",
                    isActive(link.href)
                      ? "bg-card text-foreground shadow-sm"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <IconButton aria-label="Buscar terços" onClick={() => setSearchOpen(true)}>
            <Search className="size-[18px]" />
          </IconButton>
          <IconButton
            aria-label={resolvedTheme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-[18px] dark:hidden" />
            <Moon className="hidden size-[18px] dark:block" />
          </IconButton>
          <IconButton aria-label={`Abrir sacola, ${totalItems} itens`} onClick={() => setCartOpen(true)}>
            <ShoppingBag className="size-[18px]" />
            {hydrated && totalItems > 0 && (
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-[18px] text-white transition-transform dark:text-black",
                  bump && "scale-125",
                )}
              >
                {totalItems}
              </span>
            )}
          </IconButton>
          <UserMenu />
          <IconButton className="md:hidden" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </IconButton>
        </div>
      </div>

      {menuOpen && (
        <nav aria-label="Menu móvel" className="border-t border-border/70 bg-background md:hidden">
          <ul className="container-k flex flex-col py-3">
            {[...links, { href: "/pedido", label: "Acompanhar pedido" }, ...accountLinks].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-lg px-3 py-3 text-[15px]",
                    isActive(link.href) ? "bg-secondary font-medium" : "text-foreground/80",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
