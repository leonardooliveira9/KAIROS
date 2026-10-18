"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { colorFilters, products, type ProductColor } from "@/lib/products"
import { cn } from "@/lib/utils"
import { ProductCard } from "./product-card"

export function CatalogGrid() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const active = (params.get("cor") as ProductColor | null) ?? "todos"

  const visible = active === "todos" ? products : products.filter((p) => p.color === active)
  // só mostra filtros que têm produto
  const filters = colorFilters.filter((f) => f.id === "todos" || products.some((p) => p.color === f.id))

  const select = (id: string) => {
    const q = id === "todos" ? "" : `?cor=${id}`
    router.replace(`${pathname}${q}`, { scroll: false })
  }

  return (
    <>
      <div role="tablist" aria-label="Filtrar por cor" className="mt-10 flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={active === f.id}
            onClick={() => select(f.id)}
            className={cn(
              "shrink-0 rounded-full border px-5 py-2 text-sm transition-colors",
              active === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/75 hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? "peça disponível" : "peças disponíveis"}
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i < 3} />
        ))}
      </div>
    </>
  )
}
