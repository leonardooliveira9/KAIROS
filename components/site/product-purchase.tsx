"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, Gift, Lock, QrCode, ShoppingBag, Sparkles, Truck, Zap, HeartHandshake } from "lucide-react"
import { toast } from "sonner"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/products"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"
import { QuantityStepper } from "./quantity-stepper"

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  const add = () => {
    addItem(product.slug, quantity)
    toast.success(`${quantity}× ${product.name} na sacola`)
  }

  const buyNow = () => {
    addItem(product.slug, quantity, false)
    router.push("/checkout")
  }

  return (
    <div className="lg:pt-2">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gold-strong">
        <span className="size-1.5 rounded-full bg-gold" /> {product.badge}
      </p>
      <h1 className="mt-4 font-serif text-4xl font-normal leading-tight sm:text-[2.75rem]">{product.name}</h1>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-success">
        <Truck className="size-3.5" /> Pronta entrega
      </p>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="font-serif text-4xl">{formatBRL(product.price)}</span>
          <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-gold-strong">
            Valor único
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="size-3.5 text-gold" /> À vista no PIX, com aprovação em segundos e envio ágil.
        </p>
      </div>

      <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">{product.longDescription}</p>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Especificações técnicas</p>
        <dl className="mt-2 divide-y divide-border/70 text-sm">
          {product.specs.map((s) => (
            <div key={s.label} className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{s.label}</dt>
              <dd className="text-right font-medium">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 flex gap-3">
        <QuantityStepper value={quantity} onChange={(q) => setQuantity(Math.max(1, q))} size="md" />
        <button
          type="button"
          onClick={add}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="size-4" /> Adicionar à Sacola
        </button>
      </div>
      <button
        type="button"
        onClick={buyNow}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-medium transition-colors hover:bg-secondary"
      >
        <QrCode className="size-4" /> Comprar agora com PIX ({formatBRL(product.price * quantity)})
      </button>

      <ul className="mt-5 grid grid-cols-3 gap-3 text-[11px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <Lock className="size-3.5 shrink-0 text-gold" /> Pagamento seguro
        </li>
        <li className="flex items-center gap-2">
          <BadgeCheck className="size-3.5 shrink-0 text-gold" /> Garantia Kairos
        </li>
        <li className="flex items-center gap-2">
          <Gift className="size-3.5 shrink-0 text-gold" /> Embalagem para presente
        </li>
      </ul>

      <Accordion type="single" collapsible defaultValue="cuidados" className="mt-6 space-y-3">
        <AccordionItem value="cuidados" className="rounded-2xl border border-border/60 bg-card px-5 last:border-b">
          <AccordionTrigger className="text-sm hover:no-underline">
            <span className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-gold" /> Cuidados com seu Terço
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Evite imergir em água ou expor a produtos químicos e perfumes diretos.</li>
              <li>Limpe periodicamente com um pano de algodão macio e seco.</li>
              <li>Guarde em local seco e arejado, de preferência no saquinho que acompanha a peça.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="envio" className="rounded-2xl border border-border/60 bg-card px-5 last:border-b">
          <AccordionTrigger className="text-sm hover:no-underline">
            <span className="flex items-center gap-2.5">
              <Truck className="size-4 text-gold" /> Prazos e Envio Seguro
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
            Enviamos pelos Correios (PAC ou SEDEX) para todo o Brasil, com código de rastreio. O frete e o prazo são
            calculados pelo seu CEP no checkout, já contando os {storeConfig.shipping.handlingDays} dias úteis para
            montarmos o terço.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="garantia" className="rounded-2xl border border-border/60 bg-card px-5 last:border-b">
          <AccordionTrigger className="text-sm hover:no-underline">
            <span className="flex items-center gap-2.5">
              <HeartHandshake className="size-4 text-gold" /> Garantia e Satisfação
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
            Se a peça chegar com qualquer defeito de fabricação, trocamos sem custo. Você também pode desistir da compra
            em até 7 dias após o recebimento, conforme o Código de Defesa do Consumidor.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
