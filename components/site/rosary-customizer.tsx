"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import {
  BadgeCheck,
  Check,
  Gift,
  HandHeart,
  Hourglass,
  Lock,
  QrCode,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  Type,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup } from "@/components/ui/radio-group"
import { useCart } from "@/contexts/cart-context"
import {
  beadColors,
  cords,
  crucifixes,
  customPrice,
  defaultCustom,
  INTENTION_MAX,
  medals,
  NAME_MAX,
  NAME_PRICE,
  normalizeIntention,
  normalizeName,
  type CustomRosary,
} from "@/lib/customizer"
import { formatBRL } from "@/lib/format"
import { cn } from "@/lib/utils"
import { QuantityStepper } from "./quantity-stepper"
import { CrucifixIcon, MedalIcon, PREVIEW_SPOTS, RosaryPreview, type PreviewFocus } from "./rosary-preview"

const NAME_IDEAS = ["MARIA", "JESUS", "FÉ", "AMOR", "GRATIDÃO"]

/** Acabamento de cada cor, só para a descrição do cartão */
const COLOR_FINISH: Record<CustomRosary["color"], string> = {
  azul: "Translúcida",
  preto: "Fosca",
  rosa: "Translúcida",
  perola: "Perolada",
  madeira: "Natural",
  vermelho: "Translúcida",
}

/** Uma linha sobre cada medalha, mostrada na lista */
const MEDAL_NOTE: Record<CustomRosary["medal"], string> = {
  aparecida: "Padroeira do Brasil",
  gracas: "A Medalha Milagrosa",
  "sagrado-coracao": "Amor e misericórdia de Cristo",
  "sao-bento": "Medalha de proteção espiritual",
  "espirito-santo": "A pomba, símbolo dos dons do Espírito",
}

const VIEWS: { id: PreviewFocus; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "contas", label: "Contas" },
  { id: "nome", label: "Nome" },
  { id: "medalha", label: "Medalha" },
  { id: "cruz", label: "Cruz" },
]

/** Anel de foco comum aos controles da página */
const focusRing =
  "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"

/** Cartão de opção: borda escura e marcador quando escolhido */
const choiceCard = cn(
  "group relative rounded-xl border border-border bg-card text-left text-sm transition-[border-color,box-shadow,background-color] hover:border-foreground/30",
  "data-[state=checked]:border-foreground data-[state=checked]:shadow-[0_0_0_1px_var(--foreground)]",
  focusRing,
)

function CheckMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-card text-transparent transition-colors group-data-[state=checked]:border-foreground group-data-[state=checked]:bg-foreground group-data-[state=checked]:text-background",
        className,
      )}
    >
      <Check className="size-3" strokeWidth={3} />
    </span>
  )
}

function Step({
  n,
  title,
  hint,
  value,
  children,
}: {
  n: number
  title: string
  hint?: string
  /** Escolha atual, mostrada ao lado do título */
  value?: string
  children: React.ReactNode
}) {
  const id = `passo-${n}`
  return (
    <section aria-labelledby={id} className="surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-medium text-background"
        >
          {n}
        </span>
        <h2 id={id} className="min-w-0 flex-1 font-serif text-xl leading-tight">
          {title}
        </h2>
        {value && (
          <span className="max-w-[45%] truncate text-[10px] font-medium uppercase tracking-[0.14em] text-gold">
            {value}
          </span>
        )}
      </div>
      {hint && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function RosaryCustomizer() {
  const router = useRouter()
  const { addCustom } = useCart()
  const [custom, setCustom] = useState<CustomRosary>(defaultCustom)
  const [quantity, setQuantity] = useState(1)
  const [view, setView] = useState<PreviewFocus>("geral")
  // a barra fixa do celular some quando a configuração com os botões já está na tela
  const summaryRef = useRef<HTMLElement>(null)
  const [summaryVisible, setSummaryVisible] = useState(false)

  useEffect(() => {
    const el = summaryRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setSummaryVisible(e.isIntersecting), { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const set = <K extends keyof CustomRosary>(key: K, value: CustomRosary[K]) =>
    setCustom((c) => ({ ...c, [key]: value }))
  // nome e intenção guardados no pedido não levam espaços nas pontas
  const final = { ...custom, name: custom.name.trim(), intention: custom.intention.trim() }
  const price = customPrice(final)
  const nameExtra = final.name ? NAME_PRICE : 0
  const total = price * quantity

  const color = beadColors.find((c) => c.id === custom.color)!
  const crucifix = crucifixes.find((c) => c.id === custom.crucifix)!
  const medal = medals.find((m) => m.id === custom.medal)!
  const cord = cords.find((c) => c.id === custom.cord)!
  const isDefault = JSON.stringify(custom) === JSON.stringify(defaultCustom)

  const add = () => {
    addCustom(final, quantity)
    toast.success(`${quantity}× Terço Personalizado na sacola`)
  }
  const buyNow = () => {
    addCustom(final, quantity, false)
    router.push("/checkout")
  }

  const spots: { id: Exclude<PreviewFocus, "geral">; label: string; side: "left" | "right" }[] = [
    { id: "contas", label: `Contas: ${color.label}`, side: "left" },
    { id: "medalha", label: medal.label, side: "right" },
    { id: "cruz", label: `Cruz: ${crucifix.label}`, side: "left" },
  ]

  const config = [
    { label: "Contas", value: color.label },
    { label: "Nome", value: final.name ? `“${final.name}”` : "Sem nome" },
    { label: "Crucifixo", value: crucifix.label },
    { label: "Medalha", value: medal.label },
    { label: "Montagem", value: cord.label },
  ]
  const extras = [final.intention && "Intenção escrita no cartão", final.giftBox && "Caixa de presente"].filter(Boolean)

  return (
    <>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-8">
        {/* Prévia */}
        <aside aria-label="Prévia do seu terço" className="surface p-3 sm:p-4 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <p className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]">
              <span className="size-1.5 rounded-full bg-gold" /> Peça{" "}
              <span className="hidden sm:inline">exclusiva</span> sob medida
            </p>
            <button
              type="button"
              onClick={() => {
                setCustom(defaultCustom)
                setView("geral")
              }}
              disabled={isDefault}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
                focusRing,
              )}
            >
              <RotateCcw className="size-3.5" /> Recomeçar
            </button>
          </div>

          {/* palco: fundo de linho claro, marcadores clicáveis na vista geral */}
          <div className="relative overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_50%_40%,var(--card),var(--gold-soft)_75%)] ring-1 ring-border/60 ring-inset">
            <div className="relative mx-auto my-6 max-w-[240px] sm:max-w-[300px] lg:max-w-[340px]">
              <RosaryPreview custom={final} focus={view} className="h-auto w-full" />
              {view === "geral" &&
                spots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setView(s.id)}
                    style={{ top: `${PREVIEW_SPOTS[s.id].y}%` }}
                    className={cn(
                      "absolute hidden max-w-[11rem] -translate-y-1/2 items-center gap-1.5 truncate rounded-full border border-border/70 bg-card/95 px-2.5 py-1 text-[10px] shadow-sm backdrop-blur transition-colors hover:border-foreground/30 sm:inline-flex",
                      s.side === "left" ? "right-[58%]" : "left-[58%]",
                      focusRing,
                    )}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-gold" />
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
            </div>
            {view !== "geral" && (
              <button
                type="button"
                onClick={() => setView("geral")}
                className={cn(
                  "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[11px] shadow-sm",
                  focusRing,
                )}
              >
                <X className="size-3" /> Ver inteiro
              </button>
            )}
          </div>

          {/* vistas aproximadas */}
          <div role="tablist" aria-label="Aproximar parte do terço" className="mt-3 grid grid-cols-5 gap-2">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "group rounded-lg border p-1 text-center transition-colors",
                  view === v.id ? "border-foreground" : "border-border hover:border-foreground/30",
                  focusRing,
                )}
              >
                <span className="block overflow-hidden rounded-md bg-gold-soft">
                  <RosaryPreview custom={final} focus={v.id} className="aspect-square h-auto w-full object-cover" />
                </span>
                <span
                  className={cn(
                    "mt-1 block text-[10px]",
                    view === v.id ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {v.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-2 text-center text-[11px] text-muted-foreground">
            <HandHeart className="size-3.5 shrink-0 text-gold" /> Prévia ilustrativa · cada terço é montado à mão, sob
            encomenda
          </p>
        </aside>

        {/* Escolhas */}
        <div className="space-y-4">
          <Step
            n={1}
            title="Cor das contas"
            value={color.label}
            hint="Todas as contas do terço, na cor e no acabamento que você escolher."
          >
            <RadioGroup
              aria-label="Cor das contas"
              value={custom.color}
              onValueChange={(v) => set("color", v as CustomRosary["color"])}
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            >
              {beadColors.map((c) => (
                <RadioGroupPrimitive.Item
                  key={c.id}
                  value={c.id}
                  className={cn(choiceCard, "flex flex-col items-center gap-2 px-2 pb-3 pt-4")}
                >
                  <span
                    aria-hidden
                    className="size-9 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
                    style={{ background: `radial-gradient(circle at 35% 30%, ${c.shine}, ${c.hex} 60%)` }}
                  />
                  <span className="text-center">
                    <span className="block text-[13px] font-medium leading-tight">{c.label}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{COLOR_FINISH[c.id]}</span>
                  </span>
                  <CheckMark className="absolute right-2 top-2 size-4" />
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroup>
          </Step>

          <Step
            n={2}
            title="Nome ou palavra"
            value={final.name ? `+ ${formatBRL(NAME_PRICE)}` : "Opcional"}
            hint={`Cada letra vai gravada numa conta do alto do terço. Acréscimo de ${formatBRL(NAME_PRICE)}.`}
          >
            <label htmlFor="rosary-name" className="sr-only">
              Nome ou palavra gravada
            </label>
            <div className="relative">
              <Type
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="rosary-name"
                value={custom.name}
                onChange={(e) => set("name", normalizeName(e.target.value))}
                onFocus={() => setView("nome")}
                placeholder="Ex.: MARIA, FÉ, JESUS"
                autoComplete="off"
                spellCheck={false}
                maxLength={NAME_MAX + 5}
                aria-describedby="rosary-name-help rosary-name-count"
                className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-24 text-sm uppercase tracking-[0.2em] outline-none transition-[border-color,box-shadow] placeholder:normal-case placeholder:tracking-normal focus:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <span
                  id="rosary-name-count"
                  className="px-1 text-xs tabular-nums text-muted-foreground"
                  aria-live="polite"
                >
                  <span className="sr-only">Letras usadas: </span>
                  {custom.name.length}/{NAME_MAX}
                </span>
                {custom.name && (
                  <button
                    type="button"
                    onClick={() => set("name", "")}
                    aria-label="Apagar nome"
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                      focusRing,
                    )}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
            <p id="rosary-name-help" className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              Até {NAME_MAX} letras. Acentos são removidos na gravação.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Sugestões:</span>
              {NAME_IDEAS.map((idea) => {
                const value = normalizeName(idea)
                const active = final.name === value
                return (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => {
                      set("name", active ? "" : value)
                      setView("nome")
                    }}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] tracking-[0.12em] transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                      focusRing,
                    )}
                  >
                    {idea}
                  </button>
                )
              })}
            </div>
          </Step>

          <Step n={3} title="Crucifixo" value={crucifix.label} hint="A cruz que encerra o terço, na ponta da cauda.">
            <RadioGroup
              aria-label="Crucifixo"
              value={custom.crucifix}
              onValueChange={(v) => {
                set("crucifix", v as CustomRosary["crucifix"])
                setView("cruz")
              }}
              className="grid gap-2.5 sm:grid-cols-3"
            >
              {crucifixes.map((c) => (
                <RadioGroupPrimitive.Item
                  key={c.id}
                  value={c.id}
                  className={cn(choiceCard, "flex items-center gap-3 p-3 sm:flex-col sm:items-start")}
                >
                  <span className="inline-flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/70 sm:h-20 sm:w-full">
                    <CrucifixIcon kind={c.id} className="h-11 w-auto sm:h-16" />
                  </span>
                  <span className="min-w-0 flex-1 sm:pr-1">
                    <span className="block font-medium leading-snug">{c.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{c.detail}</span>
                  </span>
                  <CheckMark className="sm:absolute sm:right-2 sm:top-2 sm:size-4" />
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroup>
          </Step>

          <Step n={4} title="Medalha" value={medal.label} hint="O entremeio que une a volta à cauda do terço.">
            <RadioGroup
              aria-label="Medalha"
              value={custom.medal}
              onValueChange={(v) => {
                set("medal", v as CustomRosary["medal"])
                setView("medalha")
              }}
              className="grid gap-2"
            >
              {medals.map((m) => (
                <RadioGroupPrimitive.Item
                  key={m.id}
                  value={m.id}
                  className={cn(choiceCard, "flex items-center gap-3 px-3 py-2.5")}
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/70">
                    <MedalIcon medal={m.id} className="h-8 w-auto" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium leading-snug">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{MEDAL_NOTE[m.id]}</span>
                  </span>
                  <CheckMark />
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroup>
          </Step>

          <Step n={5} title="Corrente ou cordão" value={cord.label} hint="O que une as contas. Não muda o preço.">
            <RadioGroup
              aria-label="Corrente ou cordão"
              value={custom.cord}
              onValueChange={(v) => {
                set("cord", v as CustomRosary["cord"])
                setView("contas")
              }}
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            >
              {cords.map((c) => (
                <RadioGroupPrimitive.Item
                  key={c.id}
                  value={c.id}
                  className={cn(choiceCard, "flex flex-col items-center gap-2 px-2 pb-3 pt-4 text-center")}
                >
                  <span aria-hidden className="flex h-5 w-14 items-center">
                    {c.id === "corrente" ? (
                      <span
                        className="h-1.5 w-full rounded-full"
                        style={{ background: `repeating-linear-gradient(90deg, ${c.hex} 0 4px, transparent 4px 6px)` }}
                      />
                    ) : (
                      <span
                        className="h-[5px] w-full rounded-full"
                        style={{
                          background: `repeating-linear-gradient(115deg, ${c.hex} 0 3px, color-mix(in srgb, ${c.hex} 70%, white) 3px 5px)`,
                        }}
                      />
                    )}
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium leading-tight">{c.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{c.detail}</span>
                  </span>
                  <CheckMark className="absolute right-2 top-2 size-4" />
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroup>
          </Step>

          <Step
            n={6}
            title="Intenção e presente"
            value="Opcional"
            hint="Sem custo. Escrevemos sua intenção à mão num cartão que acompanha o terço."
          >
            <label htmlFor="rosary-intention" className="text-xs font-medium">
              Intenção de oração
            </label>
            <div className="relative mt-2">
              <textarea
                id="rosary-intention"
                value={custom.intention}
                onChange={(e) => set("intention", normalizeIntention(e.target.value))}
                placeholder="Ex.: Pela saúde da vovó Maria"
                rows={2}
                maxLength={INTENTION_MAX + 5}
                aria-describedby="rosary-intention-count"
                className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 pr-16 text-sm leading-relaxed outline-none transition-[border-color,box-shadow] focus:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
              <span
                id="rosary-intention-count"
                className="absolute bottom-3 right-4 text-xs tabular-nums text-muted-foreground"
                aria-live="polite"
              >
                <span className="sr-only">Caracteres usados: </span>
                {custom.intention.length}/{INTENTION_MAX}
              </span>
            </div>

            <label
              htmlFor="rosary-gift"
              className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-gold-line bg-gold-soft/60 p-4 transition-colors has-[[data-state=checked]]:border-gold"
            >
              <Checkbox
                id="rosary-gift"
                checked={custom.giftBox}
                onCheckedChange={(v) => set("giftBox", v === true)}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <Gift className="size-4 text-gold" /> Caixa de presente
                  <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-gold-strong">
                    Cortesia
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  O terço segue numa caixa pronta para presentear, sem custo a mais.
                </span>
              </span>
            </label>
          </Step>
        </div>
      </div>

      {/* Configuração e compra, na largura toda */}
      <section
        ref={summaryRef}
        aria-labelledby="configuracao-titulo"
        className="surface mt-6 mb-24 p-5 shadow-sm sm:p-6 lg:mb-0"
      >
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <h2 id="configuracao-titulo" className="flex items-center gap-2 font-serif text-lg">
              <SlidersHorizontal className="size-4 text-gold" /> Configuração do seu terço
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {config.map((c) => (
                <div key={c.label} className="min-w-0 rounded-lg bg-secondary/70 px-3 py-2">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{c.label}</dt>
                  <dd className="mt-0.5 truncate text-[13px] font-medium" title={c.value}>
                    {c.value}
                  </dd>
                </div>
              ))}
            </dl>
            {extras.length > 0 && (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <Gift className="size-3.5 text-gold" /> {extras.join(" · ")}
              </p>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hourglass className="size-3.5 text-gold" /> Montado à mão sob encomenda, depois de confirmado o
              pagamento.
            </p>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gold">Total</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBRL(price - nameExtra)}
                  {final.name && ` + ${formatBRL(NAME_PRICE)} do nome`}
                  {quantity > 1 && ` · ${quantity} × ${formatBRL(price)}`}
                </p>
              </div>
              <p className="font-serif text-3xl tabular-nums sm:text-4xl" aria-live="polite">
                {formatBRL(total)}
                <span className="ml-1.5 font-sans text-xs text-muted-foreground">no PIX</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <QuantityStepper value={quantity} onChange={(q) => setQuantity(Math.max(1, q))} size="md" />
              <button
                type="button"
                onClick={add}
                className={cn(
                  "inline-flex min-w-[10rem] flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
                  focusRing,
                )}
              >
                <ShoppingBag className="size-4" /> Adicionar à Sacola
              </button>
              <button
                type="button"
                onClick={buyNow}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-ink",
                  focusRing,
                )}
              >
                <QrCode className="size-4" /> Comprar agora com PIX
              </button>
            </div>
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border/70 pt-4 text-[11px] text-muted-foreground lg:justify-end">
          <li className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-gold" /> Pagamento seguro
          </li>
          <li className="flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-gold" /> Garantia Kairos
          </li>
          <li className="flex items-center gap-1.5">
            <Gift className="size-3.5 text-gold" /> Embalagem para presente
          </li>
        </ul>
      </section>

      {/* Barra fixa no celular: prévia em miniatura, total e botão sempre à mão */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 lg:hidden",
          summaryVisible && "pointer-events-none translate-y-full",
        )}
        aria-hidden={summaryVisible}
      >
        <div className="container-k flex items-center gap-3 py-3">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary/70">
            <RosaryPreview custom={final} className="h-11 w-auto" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {quantity > 1 ? `${quantity} terços` : "Seu terço"} · {color.label}
              {final.name && ` · “${final.name}”`}
            </p>
            <p className="font-serif text-xl leading-tight tabular-nums">{formatBRL(total)}</p>
          </div>
          <button
            type="button"
            onClick={add}
            tabIndex={summaryVisible ? -1 : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
              focusRing,
            )}
          >
            <ShoppingBag className="size-4" /> Adicionar
          </button>
        </div>
      </div>
    </>
  )
}
