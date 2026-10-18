"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getProduct, type Product } from "@/lib/products"
import { shippingFor, storeConfig } from "@/lib/store-config"

const STORAGE_KEY = "kairos-cart-v2"

interface StoredItem {
  slug: string
  quantity: number
}

export interface CartLine extends StoredItem {
  product: Product
  lineTotal: number
}

interface CartContextType {
  lines: CartLine[]
  totalItems: number
  subtotal: number
  shipping: number
  total: number
  /** Quantos terços faltam para o frete grátis (0 = já tem) */
  missingForFreeShipping: number
  hydrated: boolean
  addItem: (slug: string, quantity?: number, openCart?: boolean) => void
  setQuantity: (slug: string, quantity: number) => void
  removeItem: (slug: string) => void
  clear: () => void
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoredItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [isCartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as StoredItem[]
      setItems(saved.filter((i) => getProduct(i.slug) && i.quantity > 0))
    } catch {
      // armazenamento indisponível: sacola começa vazia
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignora
    }
  }, [items, hydrated])

  const addItem = useCallback((slug: string, quantity = 1, openCart = true) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === slug)
      if (existing) {
        return prev.map((i) => (i.slug === slug ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i))
      }
      return [...prev, { slug, quantity: Math.min(20, quantity) }]
    })
    if (openCart) setCartOpen(true)
  }, [])

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug))
  }, [])

  const setQuantity = useCallback(
    (slug: string, quantity: number) => {
      if (quantity <= 0) return removeItem(slug)
      setItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, quantity: Math.min(20, quantity) } : i)))
    },
    [removeItem],
  )

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextType>(() => {
    const lines = items.flatMap((i) => {
      const product = getProduct(i.slug)
      return product ? [{ ...i, product, lineTotal: product.price * i.quantity }] : []
    })
    const totalItems = lines.reduce((s, l) => s + l.quantity, 0)
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
    const shipping = shippingFor(totalItems)
    return {
      lines,
      totalItems,
      subtotal,
      shipping,
      total: subtotal + shipping,
      missingForFreeShipping: Math.max(0, storeConfig.shipping.freeFromQuantity - totalItems),
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clear,
      isCartOpen,
      setCartOpen,
    }
  }, [items, hydrated, addItem, setQuantity, removeItem, clear, isCartOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider")
  return context
}
