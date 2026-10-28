"use client"

import { NAME_PRICE } from "@/lib/customizer"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Lock, QrCode, ShoppingBag, Trash2, Truck, X } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useCart } from "@/contexts/cart-context"
import { formatBRL, pluralize } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"
import { QuantityStepper } from "./quantity-stepper"

export function CartSheet() {
  const router = useRouter()
  const {
    lines,
    totalItems,
    subtotal,
    shipping,
    total,
    missingForFreeShipping,
    setQuantity,
    removeItem,
    isCartOpen,
    setCartOpen,
  } = useCart()

  const { freeFromQuantity } = storeConfig.shipping
  const progress = Math.min(100, Math.round((totalItems / freeFromQuantity) * 100))

  const checkout = () => {
    setCartOpen(false)
    router.push("/checkout")
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" hideClose className="w-full gap-0 border-l-0 p-0 sm:max-w-[440px]">
        <div className="flex items-start gap-3 border-b border-border/70 px-6 py-5">
          <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-full bg-gold-soft text-gold-strong">
            <ShoppingBag className="size-[18px]" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <SheetTitle className="font-serif text-xl font-normal">Sua Sacola</SheetTitle>
              {totalItems > 0 && (
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold-strong">
                  {pluralize(totalItems, "item", "itens")}
                </span>
              )}
            </div>
            <SheetDescription className="text-[13px]">
              {formatBRL(storeConfig.unitPrice)} por peça • nome gravado +{formatBRL(NAME_PRICE)}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="inline-flex size-9 items-center justify-center rounded-full bg-secondary text-foreground/70 hover:text-foreground"
            aria-label="Fechar sacola"
          >
            <X className="size-4" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-secondary text-gold">
              <ShoppingBag className="size-7" />
            </span>
            <p className="mt-5 font-serif text-xl">Sua sacola está vazia</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Escolha um terço para acompanhar seus momentos de oração.
            </p>
            <Link
              href="/produtos"
              onClick={() => setCartOpen(false)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground"
            >
              Ver terços <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
              <div className="rounded-xl bg-secondary/70 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <Truck className="size-4 text-gold" />
                    {missingForFreeShipping > 0 ? (
                      <span>
                        {/* o frete grátis conta terços, não valor */}
                        {missingForFreeShipping > 1 ? "Faltam" : "Falta"} apenas <strong>{pluralize(missingForFreeShipping, "terço", "terços")}</strong> para{" "}
                        <strong>Frete Grátis</strong>
                      </span>
                    ) : (
                      <strong className="text-success">Frete grátis garantido!</strong>
                    )}
                  </span>
                  <span className="font-medium text-gold">{progress}%</span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                  <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <ul className="space-y-3">
                {lines.map(({ key, product, quantity, lineTotal, custom }) => (
                  <li key={key} className="flex gap-4 rounded-xl border border-border/60 bg-card p-3">
                    <Link
                      href={custom ? "/personalizar" : `/produtos/${product.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-secondary"
                    >
                      <Image src={product.images[0]} alt={product.name} fill sizes="80px" className="object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-serif text-[17px] leading-tight">{product.name}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Remover ${product.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.materials}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantityStepper value={quantity} onChange={(q) => setQuantity(key, q)} min={0} />
                        <span className="font-serif text-lg">{formatBRL(lineTotal)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border/70 bg-card px-6 pb-6 pt-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal ({pluralize(totalItems, "terço", "terços")})</dt>
                  <dd>{formatBRL(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Envio para todo o Brasil</dt>
                  <dd className={shipping === 0 ? "font-medium text-success" : ""}>
                    {shipping === 0 ? "Grátis" : formatBRL(shipping)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-4">
                <div>
                  <p className="font-serif text-xl">Total</p>
                  <p className="text-[11px] text-muted-foreground">à vista no PIX</p>
                </div>
                <p className="font-serif text-3xl">{formatBRL(total)}</p>
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-secondary/70 py-2 text-[11px] text-muted-foreground">
                <QrCode className="size-3.5" /> PIX instantâneo com QR Code • Envio com rastreio
              </p>
              <button
                type="button"
                onClick={checkout}
                className="mt-3 flex w-full items-center justify-between rounded-full bg-primary px-6 py-4 text-primary-foreground transition-opacity hover:opacity-90"
              >
                <span className="flex items-center gap-2.5 font-serif text-lg">
                  <span className="size-1.5 rounded-full bg-gold" /> Finalizar Pedido via PIX
                </span>
                <span className="flex items-center gap-1.5 font-serif text-lg text-gold-line">
                  {formatBRL(total)} <ArrowRight className="size-4" />
                </span>
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="size-3" /> Ambiente seguro • Kairos Artesanal
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
