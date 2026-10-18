"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/products"
import { formatBRL } from "@/lib/format"

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { addItem } = useCart()

  const add = () => {
    addItem(product.slug)
    toast.success(`${product.name} adicionado à sacola`)
  }

  return (
    <article className="group flex flex-col rounded-2xl border border-border/60 bg-card p-3 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]">
      <Link
        href={`/produtos/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-xl bg-secondary"
        aria-label={`Ver ${product.name}`}
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-medium tracking-wide backdrop-blur">
          {product.badge}
        </span>
      </Link>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-lg leading-tight">
            <Link href={`/produtos/${product.slug}`} className="hover:underline underline-offset-4">
              {product.name}
            </Link>
          </h3>
          <span className="shrink-0 font-serif text-lg">{formatBRL(product.price)}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{product.description}</p>
        <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground/80">{product.note}</p>
        <button
          type="button"
          onClick={add}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.99]"
        >
          <ShoppingBag className="size-3.5" /> Adicionar ao carrinho
        </button>
      </div>
    </article>
  )
}
