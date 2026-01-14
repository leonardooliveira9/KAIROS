"use client"

import { ShoppingCart, Menu, X } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useState } from "react"

export function StoreHeader() {
  const { totalItems, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">Terços</span>
            <span className="text-sm text-muted-foreground hidden sm:block">Artesanais</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#produtos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Produtos
            </a>
            <a href="#sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sobre
            </a>
            <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-foreground hover:bg-secondary rounded-full transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground hover:bg-secondary rounded-full transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#produtos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Produtos
              </a>
              <a href="#sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sobre
              </a>
              <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
