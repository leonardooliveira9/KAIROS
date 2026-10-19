"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Ban,
  Check,
  ClipboardCopy,
  Clock,
  Loader2,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Truck,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { formatBRL, formatDateTime, maskCEP, maskCPF, maskPhone } from "@/lib/format"
import { cn } from "@/lib/utils"

type Status = "awaiting_payment" | "paid" | "shipped" | "canceled"

interface Order {
  id: string
  createdAt: string
  status: Status
  customer: { fullName: string; email: string; phone: string; cpf: string }
  address: { cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string; notes: string }
  items: { slug: string; name: string; price: number; quantity: number }[]
  subtotal: number
  shipping: number
  total: number
  payment: { provider: "abacatepay" | "static_pix" }
  paidAt?: string
  shippedAt?: string
  trackingCode?: string
}

const statusMeta: Record<Status, { label: string; className: string }> = {
  awaiting_payment: { label: "Aguardando PIX", className: "bg-warning-soft text-warning" },
  paid: { label: "Pago • a enviar", className: "bg-success-soft text-success" },
  shipped: { label: "Enviado", className: "bg-secondary text-foreground" },
  canceled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
}

const filters: { id: Status | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "awaiting_payment", label: "Aguardando PIX" },
  { id: "paid", label: "A enviar" },
  { id: "shipped", label: "Enviados" },
  { id: "canceled", label: "Cancelados" },
]

function StatusBadge({ status }: { status: Status }) {
  const m = statusMeta[status]
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium", m.className)}>{m.label}</span>
}

export function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Status | "all">("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" })
      if (res.status === 401 || res.status === 403) return router.replace("/entrar?next=/admin")
      const data = await res.json()
      setOrders(data.orders)
    } catch {
      toast.error("Não foi possível carregar os pedidos")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [load])

  const update = async (orderId: string, patch: { status?: Status; trackingCode?: string }) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...patch }),
    })
    const data = await res.json()
    if (!res.ok) return toast.error(data.error || "Erro ao atualizar")
    setOrders((list) => list.map((o) => (o.id === orderId ? data.order : o)))
    toast.success("Pedido atualizado")
  }

  const metrics = useMemo(() => {
    const confirmed = orders.filter((o) => o.status === "paid" || o.status === "shipped")
    return [
      { label: "Pedidos", value: String(orders.length), icon: Package },
      { label: "Aguardando PIX", value: String(orders.filter((o) => o.status === "awaiting_payment").length), icon: Clock },
      { label: "A enviar", value: String(orders.filter((o) => o.status === "paid").length), icon: Truck },
      { label: "Faturamento", value: formatBRL(confirmed.reduce((s, o) => s + o.total, 0)), icon: Wallet },
    ]
  }, [orders])

  const visible = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [o.id, o.customer.fullName, o.customer.email, o.address.city].some((v) => v.toLowerCase().includes(q))
  })

  const selected = orders.find((o) => o.id === selectedId) ?? null

  return (
    <div className="container-k py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Painel Kairos</p>
          <h1 className="mt-1 font-serif text-3xl">Pedidos</h1>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm" aria-label="Atualizar">
          <RefreshCw className="size-4" /> Atualizar
        </button>
      </header>

      <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <li key={label} className="surface p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-[0.12em]">{label}</span>
              <Icon className="size-4 text-gold" />
            </div>
            <p className="mt-3 font-serif text-3xl tabular-nums">{value}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm",
                filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/75",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative md:w-72">
          <span className="sr-only">Buscar pedido</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nº, cliente, cidade…"
            className="h-10 w-full rounded-full border border-input bg-card pl-9 pr-4 text-sm outline-none focus:border-gold"
          />
        </label>
      </div>

      <div className="surface mt-4 overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <Package className="mb-3 size-6 text-gold" />
            {orders.length === 0 ? "Nenhum pedido ainda. Eles aparecerão aqui." : "Nenhum pedido com esse filtro."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border/70 bg-secondary/50 text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Itens</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visible.map((o) => (
                  <tr key={o.id} onClick={() => setSelectedId(o.id)} className="cursor-pointer transition-colors hover:bg-secondary/40">
                    <td className="px-5 py-4 font-mono text-xs">{o.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{o.customer.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.address.city} / {o.address.state}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                    <td className="px-5 py-4">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="px-5 py-4 text-right font-medium">{formatBRL(o.total)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-md">
          {selected && <OrderDetail order={selected} onUpdate={update} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function OrderDetail({ order, onUpdate }: { order: Order; onUpdate: (id: string, patch: { status?: Status; trackingCode?: string }) => Promise<unknown> }) {
  const [tracking, setTracking] = useState(order.trackingCode ?? "")
  const [busy, setBusy] = useState(false)
  const a = order.address
  const addressText = `${order.customer.fullName}\n${a.street}, ${a.number}${a.complement ? ` - ${a.complement}` : ""}\n${a.neighborhood} - ${a.city}/${a.state}\nCEP ${maskCEP(a.cep)}`

  const run = async (patch: { status?: Status; trackingCode?: string }) => {
    setBusy(true)
    await onUpdate(order.id, patch)
    setBusy(false)
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(addressText)
      toast.success("Endereço copiado")
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  return (
    <div className="p-6">
      <SheetTitle className="font-mono text-sm">{order.id}</SheetTitle>
      <SheetDescription className="mt-1">Criado em {formatDateTime(order.createdAt)}</SheetDescription>
      <div className="mt-3 flex items-center gap-2">
        <StatusBadge status={order.status} />
        <span className="text-xs text-muted-foreground">{order.payment.provider === "abacatepay" ? "PIX AbacatePay (automático)" : "PIX estático (confirmação manual)"}</span>
      </div>

      <section className="mt-6 space-y-1 rounded-xl bg-secondary/60 p-4 text-sm">
        <p className="font-medium">{order.customer.fullName}</p>
        <p className="text-muted-foreground">{order.customer.email}</p>
        <p className="text-muted-foreground">
          {maskPhone(order.customer.phone)} • CPF {maskCPF(order.customer.cpf)}
        </p>
        <a
          href={`https://wa.me/55${order.customer.phone}?text=${encodeURIComponent(`Olá, ${order.customer.fullName.split(" ")[0]}! Aqui é da Kairos, sobre o pedido ${order.id}.`)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-success"
        >
          <MessageCircle className="size-3.5" /> Chamar no WhatsApp
        </a>
      </section>

      <section className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium">Entrega</p>
          <button type="button" onClick={copyAddress} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ClipboardCopy className="size-3.5" /> Copiar
          </button>
        </div>
        <p className="mt-2 whitespace-pre-line text-muted-foreground">{addressText}</p>
        {a.notes && <p className="mt-2 rounded-lg bg-card p-2 text-xs">Obs.: {a.notes}</p>}
      </section>

      <ul className="mt-4 space-y-2 text-sm">
        {order.items.map((i) => (
          <li key={i.slug} className="flex justify-between">
            <span>
              {i.quantity}× {i.name}
            </span>
            <span>{formatBRL(i.price * i.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between text-muted-foreground">
          <span>Frete</span>
          <span>{order.shipping === 0 ? "Grátis" : formatBRL(order.shipping)}</span>
        </li>
        <li className="flex justify-between border-t border-border/70 pt-2 font-medium">
          <span>Total</span>
          <span>{formatBRL(order.total)}</span>
        </li>
      </ul>

      <div className="mt-6 space-y-3">
        {order.status === "awaiting_payment" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(`Confirmar que o PIX de ${formatBRL(order.total)} caiu na conta?`)) run({ status: "paid" })
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-success py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            <Check className="size-4" /> Confirmar pagamento recebido
          </button>
        )}

        {(order.status === "paid" || order.status === "shipped") && (
          <div className="rounded-xl border border-border p-4">
            <label htmlFor="tracking" className="text-[13px] font-medium">
              Código de rastreio
            </label>
            <input
              id="tracking"
              value={tracking}
              onChange={(e) => setTracking(e.target.value.toUpperCase())}
              placeholder="AA123456789BR"
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 font-mono text-sm outline-none focus:border-gold"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => run({ status: "shipped", trackingCode: tracking })}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Truck className="size-4" /> {order.status === "shipped" ? "Salvar rastreio" : "Marcar como enviado"}
            </button>
          </div>
        )}

        {order.status !== "canceled" && order.status !== "shipped" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm("Cancelar este pedido?")) run({ status: "canceled" })
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 py-2.5 text-sm text-destructive disabled:opacity-50"
          >
            <Ban className="size-4" /> Cancelar pedido
          </button>
        )}
      </div>
    </div>
  )
}
