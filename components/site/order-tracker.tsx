"use client"

import { useState } from "react"
import { Check, Loader2, Package, Search, Truck, Wallet } from "lucide-react"
import { Field } from "@/components/checkout/field"
import { formatBRL, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

interface PublicOrder {
  id: string
  status: "awaiting_payment" | "paid" | "shipped" | "canceled"
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  trackingCode: string | null
  firstName: string
  city: string
  items: { slug: string; name: string; quantity: number; price: number }[]
  total: number
}

const timeline = [
  { key: "created", label: "Pedido recebido", icon: Package },
  { key: "paid", label: "PIX confirmado", icon: Wallet },
  { key: "shipped", label: "Enviado", icon: Truck },
] as const

export function OrderTracker() {
  const [orderId, setOrderId] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<PublicOrder | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrder(data.order)
    } catch (err) {
      setOrder(null)
      setError(err instanceof Error ? err.message : "Erro ao consultar")
    } finally {
      setLoading(false)
    }
  }

  const reached = (key: (typeof timeline)[number]["key"]) => {
    if (!order) return false
    if (key === "created") return true
    if (key === "paid") return order.status === "paid" || order.status === "shipped"
    return order.status === "shipped"
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={submit} className="surface space-y-4 self-start p-6 sm:p-8">
        <Field label="Número do pedido" name="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} placeholder="KRS-XXXXXXXX" required />
        <Field label="E-mail da compra" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Consultar
        </button>
      </form>

      {order ? (
        <div className="surface p-6 sm:p-8">
          <p className="eyebrow">Pedido {order.id}</p>
          <p className="mt-2 font-serif text-2xl">
            {order.status === "canceled" ? "Pedido cancelado" : `Olá, ${order.firstName}!`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Feito em {formatDateTime(order.createdAt)} • Entrega em {order.city}
          </p>

          {order.status !== "canceled" && (
            <ol className="mt-6 space-y-4">
              {timeline.map(({ key, label, icon: Icon }) => {
                const ok = reached(key)
                const when = key === "created" ? order.createdAt : key === "paid" ? order.paidAt : order.shippedAt
                return (
                  <li key={key} className="flex items-center gap-4">
                    <span
                      className={cn(
                        "inline-flex size-10 items-center justify-center rounded-full",
                        ok ? "bg-gold text-white dark:text-black" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {ok ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </span>
                    <span>
                      <span className={cn("block text-sm", ok ? "font-medium" : "text-muted-foreground")}>{label}</span>
                      {ok && when && <span className="block text-xs text-muted-foreground">{formatDateTime(when)}</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}

          {order.trackingCode && (
            <p className="mt-6 rounded-xl bg-gold-soft px-4 py-3 text-sm text-gold-strong">
              Código de rastreio: <strong className="font-mono">{order.trackingCode}</strong>
            </p>
          )}
          {order.status === "awaiting_payment" && (
            <p className="mt-6 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
              Ainda não identificamos o pagamento. Se você já pagou, aguarde alguns minutos.
            </p>
          )}

          <ul className="mt-6 space-y-2 border-t border-border/70 pt-5 text-sm">
            {order.items.map((i) => (
              <li key={i.slug} className="flex justify-between">
                <span>
                  {i.quantity}× {i.name}
                </span>
                <span>{formatBRL(i.price * i.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between pt-2 font-medium">
              <span>Total</span>
              <span>{formatBRL(order.total)}</span>
            </li>
          </ul>
        </div>
      ) : (
        <div className="hidden rounded-2xl border border-dashed border-border lg:flex lg:items-center lg:justify-center">
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            O número do pedido aparece na tela do PIX e no e-mail de confirmação.
          </p>
        </div>
      )}
    </div>
  )
}
