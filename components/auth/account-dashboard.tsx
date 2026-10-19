"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, KeyRound, Loader2, LogOut, MailWarning, Package, ShieldCheck, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Field } from "@/components/checkout/field"
import { isFullyVerified, useAuth } from "@/contexts/auth-context"
import { PhoneVerification } from "./phone-verification"
import { formatBRL, formatDateTime, maskCPF } from "@/lib/format"
import { cn } from "@/lib/utils"

type Tab = "pedidos" | "dados" | "seguranca"

interface AccountOrder {
  id: string
  status: "awaiting_payment" | "paid" | "shipped" | "canceled"
  createdAt: string
  trackingCode: string | null
  items: { slug: string; name: string; quantity: number; price: number; image: string }[]
  total: number
}

const statusLabel: Record<AccountOrder["status"], { label: string; className: string }> = {
  awaiting_payment: { label: "Aguardando PIX", className: "bg-warning-soft text-warning" },
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
  const [orders, setOrders] = useState<AccountOrder[] | null>(null)

  useEffect(() => {
    fetch("/api/account/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
  }, [])

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
          Pedidos feitos com esta conta aparecem aqui. Compras feitas sem login podem ser consultadas em{" "}
          <Link href="/pedido" className="underline underline-offset-4">Acompanhar pedido</Link>.
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
        <li key={o.id} className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-xs">{o.id}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", statusLabel[o.status].className)}>
              {statusLabel[o.status].label}
            </span>
          </div>
          <ul className="mt-4 flex flex-wrap gap-3">
            {o.items.map((i) => (
              <li key={i.slug} className="flex items-center gap-2.5 rounded-xl bg-secondary/60 p-2 pr-4 text-sm">
                <Image src={i.image} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" />
                {i.quantity}× {i.name}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-sm">
            {o.trackingCode ? (
              <span>
                Rastreio: <strong className="font-mono">{o.trackingCode}</strong>
              </span>
            ) : (
              <span className="text-muted-foreground">Código de rastreio disponível após o envio</span>
            )}
            <span className="font-serif text-lg">{formatBRL(o.total)}</span>
          </div>
        </li>
      ))}
    </ul>
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
