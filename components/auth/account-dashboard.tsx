"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Circle,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  MailWarning,
  Package,
  QrCode,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { Field } from "@/components/checkout/field"
import { useCountdown } from "@/components/checkout/pix-payment"
import { isFullyVerified, useAuth } from "@/contexts/auth-context"
import { whatsappLink } from "@/lib/store-config"
import { PhoneVerification } from "./phone-verification"
import { formatBRL, formatDateTime, maskCPF } from "@/lib/format"
import { cn } from "@/lib/utils"

type Tab = "pedidos" | "dados" | "seguranca"

interface AccountOrder {
  id: string
  status: "awaiting_payment" | "paid" | "shipped" | "canceled"
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  trackingCode: string | null
  items: { slug: string; name: string; quantity: number; price: number; image: string; details?: string }[]
  subtotal: number
  shipping: number
  total: number
  /** PIX pendente cujo prazo já acabou */
  paymentExpired: boolean
  /** Presente só enquanto o PIX pendente ainda pode ser pago */
  pix: { brCode: string; qrImage: string; expiresAt: string } | null
}

type DisplayStatus = AccountOrder["status"] | "expired"

const statusLabel: Record<DisplayStatus, { label: string; className: string }> = {
  awaiting_payment: { label: "Aguardando PIX", className: "bg-warning-soft text-warning" },
  expired: { label: "PIX expirado", className: "bg-secondary text-muted-foreground" },
  paid: { label: "Pago • em preparo", className: "bg-success-soft text-success" },
  shipped: { label: "Enviado", className: "bg-secondary text-foreground" },
  canceled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
}

export function AccountDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<Tab>("pedidos")

  const signOut = async () => {
    await logout()
    router.replace("/")
    router.refresh()
  }

  const tabs = [
    { id: "pedidos" as const, label: "Meus pedidos", icon: Package },
    { id: "dados" as const, label: "Meus dados", icon: UserRound },
    { id: "seguranca" as const, label: "Segurança", icon: KeyRound },
  ]

  return (
    <section className="container-k py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Minha conta</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Olá{user ? `, ${user.name.split(" ")[0]}` : ""}!</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          {user?.role === "admin" && (
            <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-4 py-2 text-sm font-medium text-gold-strong">
              <ShieldCheck className="size-4" /> Painel admin
            </Link>
          )}
          <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </div>

      {user && !isFullyVerified(user) && <VerificationCard />}

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Seções da conta" className="flex gap-2 overflow-x-auto lg:flex-col">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm transition-colors",
                tab === id ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", tab === id && "text-gold")} /> {label}
            </button>
          ))}
        </nav>
        <div>
          {tab === "pedidos" && <OrdersTab />}
          {tab === "dados" && <ProfileTab />}
          {tab === "seguranca" && <PasswordTab />}
        </div>
      </div>
    </section>
  )
}

export function VerifyEmailBanner() {
  const { user } = useAuth()
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")

  const resend = async () => {
    setState("sending")
    try {
      const res = await fetch("/api/auth/verify-email/resend", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState("sent")
      toast.success("Enviamos um novo link. Confira sua caixa de entrada.")
    } catch (err) {
      setState("idle")
      toast.error(err instanceof Error && err.message ? err.message : "Não foi possível enviar")
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning" role="status">
      <p className="flex items-center gap-2">
        <MailWarning className="size-4 shrink-0" />
        Confirme seu e-mail pelo link que enviamos para {user?.email ?? "você"}.
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={state !== "idle"}
        className="inline-flex items-center gap-1.5 rounded-full border border-current px-4 py-1.5 text-xs font-medium disabled:opacity-60"
      >
        {state === "sending" && <Loader2 className="size-3.5 animate-spin" />}
        {state === "sent" ? "Link enviado" : "Reenviar e-mail"}
      </button>
    </div>
  )
}

/** E-mail + telefone confirmados são obrigatórios para comprar */
export function VerificationCard({ className = "mt-6" }: { className?: string }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <section className={cn("surface space-y-4 p-5 sm:p-6", className)} aria-label="Verificação da conta">
      <div>
        <p className="flex items-center gap-2 font-serif text-xl">
          <ShieldCheck className="size-5 text-gold" /> Confirme sua conta para comprar
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Por segurança, todo pedido exige e-mail e celular confirmados.</p>
      </div>
      {user.emailVerifiedAt ? (
        <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4" /> E-mail confirmado: <strong>{user.email}</strong>
        </p>
      ) : (
        <VerifyEmailBanner />
      )}
      <PhoneVerification />
    </section>
  )
}

function OrdersTab() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [orders, setOrders] = useState<AccountOrder[] | null>(null)
  const [error, setError] = useState(false)
  const previous = useRef<Map<string, AccountOrder["status"]>>(new Map())
  // polling e "PIX venceu" podem disparar cargas ao mesmo tempo: só a mais recente vale
  const latest = useRef(0)

  const load = useCallback(async () => {
    const seq = ++latest.current
    try {
      const res = await fetch("/api/account/orders", { cache: "no-store" })
      if (seq !== latest.current) return
      if (res.status === 401) {
        // a sessão caiu de fato: confere com o servidor antes de mandar para o login,
        // senão /entrar (que vê o usuário logado) devolve para /conta e vira um loop
        if (!(await refresh())) router.replace("/entrar?next=/conta")
        else setError(true)
        return
      }
      if (!res.ok) throw new Error()
      const data: { orders: AccountOrder[] } = await res.json()
      if (seq !== latest.current) return
      // avisa quando um PIX pendente é confirmado com a página aberta
      for (const o of data.orders) {
        if (previous.current.get(o.id) === "awaiting_payment" && o.status === "paid") {
          toast.success(`Pagamento do pedido ${o.id} confirmado!`)
        }
      }
      previous.current = new Map(data.orders.map((o) => [o.id, o.status]))
      setOrders(data.orders)
      setError(false)
    } catch {
      if (seq === latest.current) setError(true)
    }
  }, [router, refresh])

  useEffect(() => {
    // falso positivo: load só muda o estado depois do await (é a mesma função do intervalo de 10s)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  // enquanto houver PIX esperando pagamento, confere o status a cada 10s
  const waiting = orders?.some((o) => o.pix) ?? false
  useEffect(() => {
    if (!waiting) return
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [waiting, load])

  if (error && !orders) {
    return (
      <div className="surface flex flex-col items-center justify-center p-10 text-center">
        <p className="font-serif text-xl">Não foi possível carregar seus pedidos</p>
        <p className="mt-1 text-sm text-muted-foreground">Confira sua conexão e tente de novo.</p>
        <button
          type="button"
          onClick={load}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm"
        >
          <RefreshCw className="size-4" /> Tentar de novo
        </button>
      </div>
    )
  }

  if (!orders) {
    return (
      <div className="surface flex h-48 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="surface flex flex-col items-center justify-center p-10 text-center">
        <Package className="size-7 text-gold" />
        <p className="mt-4 font-serif text-xl">Nenhum pedido ainda</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Os pedidos feitos com esta conta aparecem aqui. Compras antigas feitas sem login com este mesmo e-mail
          aparecem depois que o e-mail é confirmado.
        </p>
        <Link href="/produtos" className="mt-6 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground">
          Ver terços
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} onExpired={load} />
      ))}
    </ul>
  )
}

/**
 * Status mostrado ao cliente: PIX vencido sem pagamento aparece como expirado — tanto o pendente
 * quanto o que a sincronização com a AbacatePay já cancelou por vencimento.
 */
function displayStatus(o: AccountOrder): DisplayStatus {
  return o.paymentExpired && !o.paidAt ? "expired" : o.status
}

function OrderCard({ order: o, onExpired }: { order: AccountOrder; onExpired: () => void }) {
  const shown = displayStatus(o)
  const [showPix, setShowPix] = useState(false)
  const stopped = shown === "canceled" || shown === "expired"

  const steps = [
    { label: "Pedido feito", at: o.createdAt },
    { label: "Pagamento confirmado", at: o.paidAt },
    { label: "Enviado", at: o.shippedAt },
  ]

  return (
    <li className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs">{o.id}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", statusLabel[shown].className)}>
          {statusLabel[shown].label}
        </span>
      </div>

      <ul className="mt-4 flex flex-wrap gap-3">
        {o.items.map((i, idx) => (
          <li key={`${i.slug}-${idx}`} className="flex items-center gap-2.5 rounded-xl bg-secondary/60 p-2 pr-4 text-sm">
            <Image src={i.image} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" />
            <span>
              {i.quantity}× {i.name} <span className="text-muted-foreground">· {formatBRL(i.price * i.quantity)}</span>
              {i.details && <span className="block text-xs text-muted-foreground">{i.details}</span>}
            </span>
          </li>
        ))}
      </ul>

      {!stopped && (
        <ol className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.label} className={cn("flex items-center gap-2", !s.at && "text-muted-foreground")}>
              {s.at ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0" />}
              <span>
                {s.label}
                {s.at && <span className="block text-muted-foreground">{formatDateTime(s.at)}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      {o.pix && (
        <div className="mt-4 rounded-xl bg-warning-soft p-4 text-sm text-warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>Este pedido está esperando o pagamento via PIX.</p>
            <button
              type="button"
              onClick={() => setShowPix((v) => !v)}
              aria-expanded={showPix}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
            >
              <QrCode className="size-3.5" /> {showPix ? "Esconder PIX" : "Pagar agora"}
            </button>
          </div>
          {showPix && <OrderPix pix={o.pix} total={o.total} onExpired={onExpired} />}
        </div>
      )}

      {shown === "expired" && (
        <div className="mt-4 rounded-xl bg-secondary/70 p-4 text-sm">
          <p>O prazo deste PIX acabou e o pagamento não foi identificado.</p>
          <p className="mt-1 text-muted-foreground">
            Se você já pagou,{" "}
            <a
              href={whatsappLink(`Olá! Paguei o pedido ${o.id} e ele aparece como PIX expirado.`)}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              fale conosco pelo WhatsApp
            </a>
            . Se não, é só{" "}
            <Link href="/produtos" className="underline underline-offset-4">
              fazer um novo pedido
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mt-4 space-y-1 border-t border-border/70 pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatBRL(o.subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Frete</span>
          <span>{o.shipping === 0 ? "Grátis" : formatBRL(o.shipping)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {o.trackingCode ? (
            <TrackingCode code={o.trackingCode} />
          ) : (
            <span className="text-muted-foreground">
              {stopped ? "Este pedido não será enviado" : "Código de rastreio disponível após o envio"}
            </span>
          )}
          <span className="font-serif text-lg">{formatBRL(o.total)}</span>
        </div>
      </div>
    </li>
  )
}

function OrderPix({
  pix,
  total,
  onExpired,
}: {
  pix: NonNullable<AccountOrder["pix"]>
  total: number
  onExpired: () => void
}) {
  const { expired, label } = useCountdown(pix.expiresAt)

  // o prazo acabou com a tela aberta: recarrega para mostrar o pedido como expirado
  useEffect(() => {
    if (expired) onExpired()
  }, [expired, onExpired])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.brCode)
      toast.success("Código PIX copiado")
    } catch {
      toast.error("Não foi possível copiar. Selecione o código e copie manualmente.")
    }
  }

  // venceu pelo relógio do navegador: não oferece mais um código que o banco vai recusar
  if (expired) {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-card p-4 text-foreground">
        <Loader2 className="size-4 animate-spin text-muted-foreground" /> O prazo deste PIX acabou. Atualizando o pedido…
      </p>
    )
  }

  return (
    <div className="mt-4 grid gap-4 rounded-xl bg-card p-4 text-foreground sm:grid-cols-[160px_1fr]">
      <div className="mx-auto w-full max-w-[200px] rounded-lg bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pix.qrImage} alt="QR Code PIX do pedido" className="aspect-square w-full" />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-3">
        <p className="text-sm">
          Pague <strong>{formatBRL(total)}</strong> pelo app do banco. Expira em{" "}
          <strong className="tabular-nums">{label}</strong>.
        </p>
        <input
          readOnly
          aria-label="Código PIX copia e cola"
          value={pix.brCode}
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 min-w-0 rounded-lg bg-secondary px-3 font-mono text-xs text-muted-foreground outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground"
        >
          <Copy className="size-3.5" /> Copiar código PIX
        </button>
        <p className="text-xs text-muted-foreground">Depois de pagar, o status desta página atualiza sozinho.</p>
      </div>
    </div>
  )
}

function TrackingCode({ code }: { code: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Código de rastreio copiado")
    } catch {
      toast.error("Não foi possível copiar")
    }
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      Rastreio: <strong className="font-mono">{code}</strong>
      <button
        type="button"
        onClick={copy}
        aria-label="Copiar código de rastreio"
        className="rounded-full p-1 text-muted-foreground hover:text-foreground"
      >
        <Copy className="size-3.5" />
      </button>
      <a href="https://rastreamento.correios.com.br/" target="_blank" rel="noreferrer" className="text-xs underline underline-offset-4">
        Rastrear nos Correios
      </a>
    </span>
  )
}

function ProfileTab() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name ?? "",
    cpf: user?.cpf ? maskCPF(user.cpf) : "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors(data.fields ?? {})
        throw new Error(data.error)
      }
      setErrors({})
      setUser(data.user)
      toast.success("Dados salvos")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="surface max-w-xl space-y-4 p-6 sm:p-8">
      <div>
        <h2 className="font-serif text-2xl">Meus dados</h2>
        <p className="mt-1 text-sm text-muted-foreground">Usamos para preencher o checkout automaticamente.</p>
      </div>
      <Field label="Nome completo" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
      <Field label="E-mail" name="email" value={user?.email ?? ""} disabled hint="Para trocar o e-mail, fale conosco." />
      <div>
        <Field label="CPF" name="cpf" inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} error={errors.cpf} placeholder="000.000.000-00" />
      </div>
      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {saving && <Loader2 className="size-4 animate-spin" />} Salvar
      </button>
      <div className="border-t border-border/70 pt-5">
        <p className="mb-3 text-[13px] font-medium">Celular (WhatsApp)</p>
        <PhoneVerification compact />
      </div>
    </form>
  )
}

function PasswordTab() {
  const { user, refresh } = useAuth()
  const hasPassword = user?.hasPassword ?? true
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors(data.fields ?? {})
        throw new Error(data.error)
      }
      setErrors({})
      setForm({ currentPassword: "", newPassword: "" })
      toast.success(hasPassword ? "Senha alterada. Outros aparelhos foram desconectados." : "Senha criada. Agora você também pode entrar com e-mail e senha.")
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="surface max-w-xl space-y-4 p-6 sm:p-8">
      <div>
        <h2 className="font-serif text-2xl">{hasPassword ? "Alterar senha" : "Criar senha"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasPassword
            ? "Ao trocar a senha, as sessões em outros aparelhos são encerradas."
            : "Sua conta usa o login com Google. Crie uma senha se quiser entrar também com e-mail."}
        </p>
      </div>
      {user?.googleLinked && (
        <p className="rounded-xl bg-secondary/70 px-4 py-3 text-xs text-muted-foreground">Conta Google conectada.</p>
      )}
      {hasPassword && <Field label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} error={errors.currentPassword} />}
      <Field label="Nova senha" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} error={errors.newPassword} hint="Mínimo de 8 caracteres." />
      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {saving && <Loader2 className="size-4 animate-spin" />} {hasPassword ? "Alterar senha" : "Criar senha"}
      </button>
    </form>
  )
}
