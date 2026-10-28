"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2, Plus, TicketPercent, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Field } from "@/components/checkout/field"
import { Switch } from "@/components/ui/switch"
import { couponLabel, todayInBrazil, type Coupon, type CouponKind } from "@/lib/coupons"
import { formatBRL } from "@/lib/format"
import { cn } from "@/lib/utils"

const kinds: { id: CouponKind; label: string }[] = [
  { id: "percent", label: "% nos produtos" },
  { id: "fixed", label: "R$ de desconto" },
  { id: "shipping", label: "Frete grátis" },
]

const emptyForm = { code: "", kind: "percent" as CouponKind, value: "10", minSubtotal: "", expiresOn: "", maxUses: "" }

const toNumber = (v: string) => Number(v.replace(",", "."))

/** "2026-12-31" → "31/12/2026" */
const brDate = (iso: string) => iso.split("-").reverse().join("/")

export function AdminCoupons() {
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/coupons", { cache: "no-store" })
    if (res.status === 401 || res.status === 403) return router.replace("/entrar?next=/admin/cupons")
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error("Não foi possível carregar os cupons")
    setCoupons(data.coupons)
  }, [router])

  useEffect(() => {
    // falso positivo: load só muda o estado depois do await
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const set = (key: keyof typeof emptyForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }))
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          kind: form.kind,
          value: form.kind === "shipping" ? 0 : toNumber(form.value),
          minSubtotal: form.minSubtotal ? toNumber(form.minSubtotal) : 0,
          expiresOn: form.expiresOn || null,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors(data.fields ?? {})
        throw new Error(data.error || "Erro ao criar o cupom")
      }
      setCoupons((list) => [data.coupon, ...(list ?? [])])
      setForm(emptyForm)
      toast.success(`Cupom ${data.coupon.code} criado`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar o cupom")
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (c: Coupon) => {
    setBusy(c.code)
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c.code, active: !c.active }),
      })
      if (!res.ok) throw new Error()
      setCoupons((list) => list?.map((x) => (x.code === c.code ? { ...x, active: !c.active } : x)) ?? null)
    } catch {
      toast.error("Não foi possível salvar")
    } finally {
      setBusy(null)
    }
  }

  const remove = async (c: Coupon) => {
    if (!confirm(`Apagar o cupom ${c.code}? Pedidos que já usaram não mudam.`)) return
    setBusy(c.code)
    try {
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(c.code)}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setCoupons((list) => list?.filter((x) => x.code !== c.code) ?? null)
      toast.success("Cupom apagado")
    } catch {
      toast.error("Não foi possível apagar")
    } finally {
      setBusy(null)
    }
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Código copiado")
    } catch {
      // sem permissão de área de transferência: o código está na tela
    }
  }

  const today = todayInBrazil()
  const statusOf = (c: Coupon) =>
    !c.active
      ? { label: "Desligado", className: "bg-secondary text-muted-foreground" }
      : c.expiresOn && today > c.expiresOn
        ? { label: "Expirado", className: "bg-secondary text-muted-foreground" }
        : c.maxUses !== null && c.uses >= c.maxUses
          ? { label: "Esgotado", className: "bg-secondary text-muted-foreground" }
          : { label: "Valendo", className: "bg-success-soft text-success" }

  return (
    <div className="container-k py-8">
      <header>
        <p className="eyebrow">Painel Kairos</p>
        <h1 className="mt-1 font-serif text-3xl">Cupons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O cliente digita o código no checkout. O uso só é contado quando o pagamento é confirmado.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        <form onSubmit={create} noValidate className="surface space-y-4 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl">
            <Plus className="size-4 text-gold" /> Novo cupom
          </h2>
          <Field
            label="Código"
            name="code"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
            error={errors.code}
            placeholder="NATAL10"
            maxLength={20}
          />
          <div className="space-y-1.5">
            <span className="text-[13px] font-medium">Tipo</span>
            <div role="radiogroup" aria-label="Tipo de desconto" className="grid grid-cols-3 gap-2">
              {kinds.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  role="radio"
                  aria-checked={form.kind === k.id}
                  onClick={() => set("kind", k.id)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-xs",
                    form.kind === k.id ? "border-gold bg-gold-soft font-medium" : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          {form.kind !== "shipping" && (
            <Field
              label={form.kind === "percent" ? "Desconto (%)" : "Desconto (R$)"}
              name="value"
              inputMode="decimal"
              value={form.value}
              onChange={(e) => set("value", e.target.value.replace(/[^\d.,]/g, ""))}
              error={errors.value}
            />
          )}
          <Field
            label="Compra mínima em produtos (R$)"
            name="minSubtotal"
            inputMode="decimal"
            value={form.minSubtotal}
            onChange={(e) => set("minSubtotal", e.target.value.replace(/[^\d.,]/g, ""))}
            error={errors.minSubtotal}
            placeholder="Sem mínimo"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Vale até (inclusive)"
              name="expiresOn"
              type="date"
              min={today}
              value={form.expiresOn}
              onChange={(e) => set("expiresOn", e.target.value)}
              error={errors.expiresOn}
              hint="Vazio = não expira"
            />
            <Field
              label="Limite de usos"
              name="maxUses"
              inputMode="numeric"
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value.replace(/\D/g, ""))}
              error={errors.maxUses}
              placeholder="Sem limite"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />} Criar cupom
          </button>
        </form>

        <div className="surface overflow-hidden">
          {!coupons ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <TicketPercent className="mb-3 size-6 text-gold" />
              Nenhum cupom ainda. Crie o primeiro ao lado.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {coupons.map((c) => {
                const status = statusOf(c)
                return (
                  <li key={c.code} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => copy(c.code)} className="inline-flex items-center gap-1.5 font-mono text-sm font-medium" aria-label={`Copiar ${c.code}`}>
                          {c.code} <Copy className="size-3 text-muted-foreground" />
                        </button>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", status.className)}>{status.label}</span>
                      </p>
                      <p className="mt-0.5 text-sm">{couponLabel(c)}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.minSubtotal > 0 ? `Mínimo ${formatBRL(c.minSubtotal)}` : "Sem mínimo"}
                        {" • "}
                        {c.expiresOn ? `até ${brDate(c.expiresOn)}` : "sem validade"}
                        {" • "}
                        {c.uses} {c.uses === 1 ? "uso" : "usos"}
                        {c.maxUses !== null && ` de ${c.maxUses}`}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={c.active} onCheckedChange={() => toggle(c)} disabled={busy !== null} aria-label={`Ligado: ${c.code}`} />
                      Ligado
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      disabled={busy !== null}
                      aria-label={`Apagar ${c.code}`}
                      className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    >
                      {busy === c.code ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
