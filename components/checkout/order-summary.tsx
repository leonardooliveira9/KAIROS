import Image from "next/image"
import { Lock, MapPin, ReceiptText, Truck, BadgeCheck } from "lucide-react"
import { formatBRL, maskCEP, pluralize } from "@/lib/format"
import { deliveryLabel } from "@/lib/shipping"

export interface SummaryLine {
  /** Identifica a linha (o personalizado pode aparecer mais de uma vez com escolhas diferentes) */
  key: string
  slug: string
  name: string
  materials?: string
  image: string
  quantity: number
  price: number
}

export function OrderSummary({
  lines,
  subtotal,
  shipping,
  discount = null,
}: {
  lines: SummaryLine[]
  subtotal: number
  /** Frete escolhido; null enquanto o cliente não informou o CEP e o serviço */
  shipping: { name: string; price: number; days: number } | null
  /** Cupom aplicado e o desconto em R$ */
  discount?: { code: string; amount: number } | null
}) {
  const total = subtotal + (shipping?.price ?? 0) - (discount?.amount ?? 0)
  const count = lines.reduce((s, l) => s + l.quantity, 0)
  return (
    <section className="surface p-5 sm:p-6" aria-label="Resumo do pedido">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 font-serif text-xl">
          <ReceiptText className="size-[18px] text-gold" /> Resumo da Devoção
        </h2>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
          {pluralize(count, "item", "itens")}
        </span>
      </div>

      <ul className="mt-5 space-y-3">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-3 rounded-xl bg-secondary/60 p-2.5">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
              <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{l.name}</p>
              {l.materials && <p className="line-clamp-2 text-xs text-muted-foreground">{l.materials}</p>}
              <div className="mt-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">Qtd: {l.quantity} un.</span>
                <span className="text-sm">{formatBRL(l.price * l.quantity)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal dos produtos</dt>
          <dd>{formatBRL(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            {shipping ? `Frete ${shipping.name}` : "Frete dos Correios"} <Truck className="size-3.5" />
          </dt>
          <dd className={shipping ? "" : "text-muted-foreground"}>{shipping ? formatBRL(shipping.price) : "informe o CEP"}</dd>
        </div>
        {discount && discount.amount > 0 && (
          <div className="flex justify-between text-gold-strong">
            <dt>Cupom {discount.code}</dt>
            <dd>− {formatBRL(discount.amount)}</dd>
          </div>
        )}
      </dl>
      {shipping && (
        <p className="mt-3 text-xs text-muted-foreground">Entrega em {deliveryLabel(shipping.days)}, com rastreio.</p>
      )}
      <div className="mt-5 flex items-end justify-between border-t border-border/70 pt-5">
        <span className="font-serif text-xl">{shipping ? "Total a transferir" : "Total sem o frete"}</span>
        <span className="font-serif text-3xl text-gold-strong">{formatBRL(total)}</span>
      </div>
    </section>
  )
}

export function AddressCard({
  name,
  address,
  days,
}: {
  name: string
  address: { street: string; number: string; complement?: string; neighborhood: string; city: string; state: string; cep: string }
  /** Prazo do frete escolhido, se já houver */
  days?: number
}) {
  return (
    <section className="surface p-5 sm:p-6" aria-label="Endereço de entrega">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 font-serif text-xl">
          <MapPin className="size-[18px] text-gold" /> Endereço de Entrega
        </h2>
        <BadgeCheck className="size-5 text-gold" />
      </div>
      <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm leading-relaxed">
        <p className="font-medium">{name}</p>
        <p className="text-muted-foreground">
          {address.street}, {address.number}
          {address.complement ? ` - ${address.complement}` : ""}
        </p>
        <p className="text-muted-foreground">
          {address.neighborhood} • {address.city} / {address.state}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          CEP: {maskCEP(address.cep)}
          {days ? ` • Entrega em ${deliveryLabel(days)}` : ""}
        </p>
      </div>
    </section>
  )
}

export function ProtectedCard() {
  return (
    <section className="rounded-2xl bg-secondary/70 p-5">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Lock className="size-4 text-gold" /> Compra Protegida & Autêntica
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Produzido com materiais nobres e energias de paz. Embalagem acolhedora desenvolvida especialmente para proteger
        cada conta durante a viagem.
      </p>
    </section>
  )
}
