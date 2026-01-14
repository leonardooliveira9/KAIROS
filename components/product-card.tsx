"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/products"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-lg text-card-foreground mb-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-card-foreground">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Comprar
          </button>
        </div>
      </div>
    </div>
  )
}
