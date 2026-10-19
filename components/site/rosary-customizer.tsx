"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, HandHeart, QrCode, ShoppingBag, Type } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"
import {
  beadColors,
  crucifixes,
  customPrice,
  defaultCustom,
  describeCustom,
  medals,
  NAME_MAX,
  NAME_PRICE,
  normalizeName,
  type CustomRosary,
} from "@/lib/customizer"
import { formatBRL } from "@/lib/format"
import { cn } from "@/lib/utils"
import { QuantityStepper } from "./quantity-stepper"
import { RosaryPreview } from "./rosary-preview"

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl">
          <span className="mr-2 text-sm text-gold">{n}.</span>
          {title}
        </h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Botão de opção (role=radio) usado nas listas de crucifixo e medalha */
function Choice({
  label,
  checked,
  onSelect,
  children,
  className,
}: {
  label: string
  checked: boolean
  onSelect: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-label={label}
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "relative rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        checked ? "border-gold bg-gold-soft" : "border-border bg-card hover:bg-secondary",
        className,
      )}
    >
      {children}
      {checked && <Check className="absolute right-3 top-3 size-4 text-gold" aria-hidden />}
    </button>
  )
}

export function RosaryCustomizer() {
  const router = useRouter()
  const { addCustom } = useCart()
  const [custom, setCustom] = useState<CustomRosary>(defaultCustom)
  const [quantity, setQuantity] = useState(1)

  const set = <K extends keyof CustomRosary>(key: K, value: CustomRosary[K]) => setCustom((c) => ({ ...c, [key]: value }))
  // o nome guardado no pedido não leva espaços nas pontas
  const final = { ...custom, name: custom.name.trim() }
  const price = customPrice(final)

  const add = () => {
    addCustom(final, quantity)
    toast.success(`${quantity}× Terço Personalizado na sacola`)
  }
  const buyNow = () => {
    addCustom(final, quantity, false)
    router.push("/checkout")
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
      <div className="surface flex flex-col items-center p-5 sm:p-8 lg:sticky lg:top-24">
        <RosaryPreview custom={final} className="h-auto w-full max-w-[340px]" />
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">{describeCustom(final)}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-[11px] text-gold-strong">
          <HandHeart className="size-3.5" /> Prévia ilustrativa — cada terço é montado à mão
        </p>
      </div>

      <div className="space-y-4">
        <Step n={1} title="Cor das contas">
          <div role="radiogroup" aria-label="Cor das contas" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {beadColors.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-label={c.label}
                aria-checked={custom.color === c.id}
                onClick={() => set("color", c.id)}
                className="group flex flex-col items-center gap-2 text-xs"
              >
                <span
                  className={cn(
                    "size-11 rounded-full ring-offset-2 ring-offset-card transition-shadow",
                    custom.color === c.id ? "ring-2 ring-gold" : "ring-1 ring-border group-hover:ring-gold-line",
                  )}
                  style={{ background: `radial-gradient(circle at 35% 30%, ${c.shine}, ${c.hex} 60%)` }}
                />
                <span className={custom.color === c.id ? "font-medium" : "text-muted-foreground"}>{c.label}</span>
              </button>
            ))}
          </div>
        </Step>

        <Step n={2} title="Nome ou palavra" hint={`Opcional • +${formatBRL(NAME_PRICE)}`}>
          <label htmlFor="rosary-name" className="sr-only">
            Nome ou palavra gravada
          </label>
          <div className="relative">
            <Type className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="rosary-name"
              value={custom.name}
              onChange={(e) => set("name", normalizeName(e.target.value))}
              placeholder="Ex.: MARIA, FÉ, JESUS"
              autoComplete="off"
              className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-16 text-sm uppercase tracking-[0.2em] outline-none placeholder:normal-case placeholder:tracking-normal focus:border-gold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {custom.name.length}/{NAME_MAX}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Até {NAME_MAX} letras em contas de letrinhas, no alto do terço. Acentos são removidos (contas não têm acento).
          </p>
        </Step>

        <Step n={3} title="Crucifixo">
          <div role="radiogroup" aria-label="Crucifixo" className="grid gap-3 sm:grid-cols-3">
            {crucifixes.map((c) => (
              <Choice key={c.id} label={c.label} checked={custom.crucifix === c.id} onSelect={() => set("crucifix", c.id)}>
                <span className="block pr-5 font-medium">{c.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{c.detail}</span>
              </Choice>
            ))}
          </div>
        </Step>

        <Step n={4} title="Medalha">
          <div role="radiogroup" aria-label="Medalha" className="grid gap-2.5 sm:grid-cols-2">
            {medals.map((m) => (
              <Choice key={m.id} label={m.label} checked={custom.medal === m.id} onSelect={() => set("medal", m.id)} className="py-2.5">
                <span className="block pr-6">{m.label}</span>
              </Choice>
            ))}
          </div>
        </Step>

        <section className="surface p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Seu terço</p>
              <p className="mt-1 font-serif text-3xl">{formatBRL(price)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {final.name ? `${formatBRL(price - NAME_PRICE)} + ${formatBRL(NAME_PRICE)} do nome` : "Sem acréscimo"} • à vista no PIX
              </p>
            </div>
            <QuantityStepper value={quantity} onChange={(q) => setQuantity(Math.max(1, q))} size="md" />
          </div>
          <button
            type="button"
            onClick={add}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ShoppingBag className="size-4" /> Adicionar à Sacola
          </button>
          <button
            type="button"
            onClick={buyNow}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <QrCode className="size-4" /> Comprar agora com PIX ({formatBRL(price * quantity)})
          </button>
        </section>
      </div>
    </div>
  )
}
