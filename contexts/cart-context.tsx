"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getProduct, type Product } from "@/lib/products"
import { CUSTOM_SLUG, customKey, customProduct, parseCustom, type CustomRosary } from "@/lib/customizer"

const STORAGE_KEY = "kairos-cart-v2"

interface StoredItem {
  slug: string
  quantity: number
  /** Só no terço personalizado: as escolhas do cliente */
  custom?: CustomRosary
}

export interface CartLine extends StoredItem {
  /** Identifica a linha: o slug, ou slug + escolhas no personalizado */
  key: string
  product: Product
  lineTotal: number
}

const keyOf = (i: StoredItem) => (i.custom ? customKey(i.custom) : i.slug)

function productOf(i: StoredItem) {
  if (i.slug === CUSTOM_SLUG) return i.custom ? customProduct(i.custom) : undefined
  return getProduct(i.slug)
}

interface CartContextType {
  lines: CartLine[]
  totalItems: number
  /** Soma dos produtos; o frete é cotado pelo CEP no checkout */
  subtotal: number
  hydrated: boolean
  addItem: (slug: string, quantity?: number, openCart?: boolean) => void
  addCustom: (custom: CustomRosary, quantity?: number, openCart?: boolean) => void
  /** `key` é o `CartLine.key` */
  setQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
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
      // leitura única do localStorage depois de montar (no servidor a sacola começa vazia, sem erro de hidratação)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(
        saved
          .map((i) => (i.slug === CUSTOM_SLUG ? { ...i, custom: parseCustom(i.custom) ?? undefined } : i))
          .filter((i) => productOf(i) && i.quantity > 0),
      )
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

  const add = useCallback((item: StoredItem, openCart: boolean) => {
    const key = keyOf(item)
    setItems((prev) => {
      const existing = prev.find((i) => keyOf(i) === key)
      if (existing) {
        return prev.map((i) => (keyOf(i) === key ? { ...i, quantity: Math.min(20, i.quantity + item.quantity) } : i))
      }
      return [...prev, { ...item, quantity: Math.min(20, item.quantity) }]
    })
    if (openCart) setCartOpen(true)
  }, [])

  const addItem = useCallback((slug: string, quantity = 1, openCart = true) => add({ slug, quantity }, openCart), [add])

  const addCustom = useCallback(
    (custom: CustomRosary, quantity = 1, openCart = true) => add({ slug: CUSTOM_SLUG, quantity, custom }, openCart),
    [add],
  )

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => keyOf(i) !== key))
  }, [])

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      if (quantity <= 0) return removeItem(key)
      setItems((prev) => prev.map((i) => (keyOf(i) === key ? { ...i, quantity: Math.min(20, quantity) } : i)))
    },
    [removeItem],
  )

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextType>(() => {
    const lines = items.flatMap((i) => {
      const product = productOf(i)
      return product ? [{ ...i, key: keyOf(i), product, lineTotal: product.price * i.quantity }] : []
    })
    const totalItems = lines.reduce((s, l) => s + l.quantity, 0)
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
    return {
      lines,
      totalItems,
      subtotal,
      hydrated,
      addItem,
      addCustom,
      setQuantity,
      removeItem,
      clear,
      isCartOpen,
      setCartOpen,
    }
  }, [items, hydrated, addItem, addCustom, setQuantity, removeItem, clear, isCartOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider")
  return context
}
