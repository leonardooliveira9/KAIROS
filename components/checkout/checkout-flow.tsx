"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Loader2, MessageCircle, ShoppingBag, UserRound, MapPin } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"
import { isFullyVerified, useAuth } from "@/contexts/auth-context"
import { VerificationCard } from "@/components/auth/account-dashboard"
import { GoogleButton } from "@/components/auth/google-button"
import { customerSchema, addressSchema, fieldErrors, UFS } from "@/lib/validation"
import { formatBRL, maskCEP, maskCPF, maskPhone, onlyDigits } from "@/lib/format"
import { storeConfig, whatsappLink } from "@/lib/store-config"
import { cn } from "@/lib/utils"
import { CheckoutStepper } from "./stepper"
import { Field } from "./field"
import { AddressCard, OrderSummary, ProtectedCard, type SummaryLine } from "./order-summary"
import { PixPayment, type PixInfo } from "./pix-payment"

const DRAFT_KEY = "kairos-checkout-draft"
const PENDING_KEY = "kairos-pending-pix"

const emptyCustomer = { fullName: "", email: "", phone: "", cpf: "" }
const emptyAddress = { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", notes: "" }

type Customer = typeof emptyCustomer
type Address = typeof emptyAddress
type Errors = Record<string, string>

function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function writeSession(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignora
  }
}

export function CheckoutFlow() {
  const cart = useCart()
  const { user, loading: authLoading, setUser } = useAuth()
  const [step, setStep] = useState(1)
  const [customer, setCustomer] = useState<Customer>(emptyCustomer)
  const [address, setAddress] = useState<Address>(emptyAddress)
  const [errors, setErrors] = useState<Errors>({})
  const [pix, setPix] = useState<PixInfo | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [paid, setPaid] = useState<{ orderId: string; lines: SummaryLine[]; subtotal: number; shipping: number } | null>(null)
  const [cepLoading, setCepLoading] = useState(false)
  const restored = useRef(false)
  const numberRef = useRef<HTMLInputElement>(null)

  const lines: SummaryLine[] = cart.lines.map((l) => ({
    slug: l.slug,
    name: l.product.name,
    materials: l.product.materials,
    image: l.product.images[0],
    quantity: l.quantity,
    price: l.product.price,
  }))

  // restaura rascunho e PIX pendente (ex.: cliente recarregou a página)
  useEffect(() => {
    if (!cart.hydrated || restored.current) return
    restored.current = true
    const draft = readSession<{ customer: Customer; address: Address }>(DRAFT_KEY)
    if (draft) {
      setCustomer({ ...emptyCustomer, ...draft.customer })
      setAddress({ ...emptyAddress, ...draft.address })
    }
    const pending = readSession<PixInfo>(PENDING_KEY)
    if (pending && new Date(pending.payment.expiresAt).getTime() > Date.now() && Math.abs(pending.total - cart.total) < 0.01) {
      setPix(pending)
      setStep(3)
    } else {
      writeSession(PENDING_KEY, null)
    }
  }, [cart.hydrated, cart.total])

  useEffect(() => {
    if (restored.current) writeSession(DRAFT_KEY, { customer, address })
  }, [customer, address])

  // logado: preenche os campos vazios com os dados da conta
  useEffect(() => {
    if (!user) return
    setCustomer((c) => ({
      fullName: c.fullName || user.name,
      // e-mail e telefone do pedido são sempre os confirmados na conta
      email: user.email,
      phone: user.phone ? maskPhone(user.phone) : "",
      cpf: c.cpf || (user.cpf ? maskCPF(user.cpf) : ""),
    }))
  }, [user])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const setC = (key: keyof Customer, value: string) => {
    setCustomer((c) => ({ ...c, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }))
  }
  const setA = (key: keyof Address, value: string) => {
    setAddress((a) => ({ ...a, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }))
  }

  const lookupCep = async (masked: string) => {
    const cep = onlyDigits(masked)
    if (cep.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) {
        setErrors((e) => ({ ...e, cep: "CEP não encontrado" }))
        return
      }
      setAddress((a) => ({
        ...a,
        street: data.logradouro || a.street,
        neighborhood: data.bairro || a.neighborhood,
        city: data.localidade || a.city,
        state: data.uf || a.state,
      }))
      setErrors((e) => ({ ...e, cep: "", street: "", neighborhood: "", city: "", state: "" }))
      numberRef.current?.focus()
    } catch {
      // sem internet ou ViaCEP fora: o cliente preenche manualmente
    } finally {
      setCepLoading(false)
    }
  }

  const goToAddress = (e: React.FormEvent) => {
    e.preventDefault()
    const r = customerSchema.safeParse(customer)
    if (!r.success) return setErrors(fieldErrors(r.error))
    setErrors({})
    setStep(2)
  }

  const createPix = useCallback(async () => {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          address,
          items: cart.lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.fields) setErrors(data.fields)
        throw new Error(data.error || "Não foi possível gerar o PIX.")
      }
      const info: PixInfo = { orderId: data.orderId, total: data.total, payment: data.payment }
      setPix(info)
      writeSession(PENDING_KEY, info)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erro ao gerar o PIX.")
    } finally {
      setCreating(false)
    }
  }, [customer, address, cart.lines])

  const goToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    const r = addressSchema.safeParse(address)
    if (!r.success) return setErrors(fieldErrors(r.error))
    setErrors({})
    setStep(3)
    createPix()
  }

  // guarda os valores atuais da sacola para usar dentro do polling sem reiniciá-lo a cada render
  const latest = useRef({ lines, subtotal: cart.subtotal, shipping: cart.shipping, clear: cart.clear })
  latest.current = { lines, subtotal: cart.subtotal, shipping: cart.shipping, clear: cart.clear }

  const finish = useCallback((orderId: string) => {
    const { lines, subtotal, shipping, clear } = latest.current
    setPaid({ orderId, lines, subtotal, shipping })
    writeSession(PENDING_KEY, null)
    writeSession(DRAFT_KEY, null)
    clear()
  }, [])

  // consulta o status do pagamento a cada 5s
  useEffect(() => {
    if (!pix || paid) return
    let active = true
    const check = async () => {
      try {
        const res = await fetch(`/api/orders/${pix.orderId}/status`, { cache: "no-store" })
        const data = await res.json()
        if (active && (data.status === "paid" || data.status === "shipped")) finish(pix.orderId)
      } catch {
        // tenta de novo no próximo ciclo
      }
    }
    const t = setInterval(check, 5000)
    check()
    return () => {
      active = false
      clearInterval(t)
    }
  }, [pix, paid, finish])

  const simulate = async () => {
    if (!pix) return
    setSimulating(true)
    try {
      const res = await fetch(`/api/orders/${pix.orderId}/simulate`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.status === "paid") finish(pix.orderId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na simulação")
    } finally {
      setSimulating(false)
    }
  }

  const regenerate = () => {
    writeSession(PENDING_KEY, null)
    setPix(null)
    createPix()
  }

  if (!cart.hydrated || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (paid) return <SuccessScreen {...paid} email={customer.email} name={customer.fullName} />

  if (cart.lines.length === 0 && !pix) {
    return (
      <div className="container-k flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-secondary text-gold">
          <ShoppingBag className="size-7" />
        </span>
        <h1 className="mt-5 font-serif text-3xl">Sua sacola está vazia</h1>
        <p className="mt-2 text-muted-foreground">Escolha um terço para continuar.</p>
        <Link href="/produtos" className="mt-6 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground">
          Ver terços
        </Link>
      </div>
    )
  }

  // Compra exige conta com e-mail e telefone confirmados
  if (!user || !isFullyVerified(user)) {
    return (
      <div className="container-k py-8 sm:py-10">
        <h1 className="sr-only">Finalizar pedido</h1>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {!user ? (
            <section className="surface p-6 sm:p-8">
              <p className="eyebrow flex items-center gap-1.5">
                <UserRound className="size-3.5" /> Antes de pagar
              </p>
              <h2 className="mt-2 font-serif text-2xl">Entre para finalizar sua compra</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Para sua segurança, os pedidos são feitos com uma conta com e-mail e celular confirmados. Sua sacola fica
                guardada.
              </p>
              <div className="mt-6 space-y-3">
                <GoogleButton onSuccess={setUser} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href="/entrar?next=/checkout" className="inline-flex items-center justify-center rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground">
                    Entrar com e-mail
                  </Link>
                  <Link href="/cadastrar?next=/checkout" className="inline-flex items-center justify-center rounded-full border border-border bg-card py-3 text-sm font-medium">
                    Criar conta
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <VerificationCard className="" />
          )}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <OrderSummary lines={lines} subtotal={cart.subtotal} shipping={cart.shipping} />
            <ProtectedCard />
          </aside>
        </div>
      </div>
    )
  }

  const addressComplete = step >= 3 || addressSchema.safeParse(address).success

  return (
    <div className="container-k py-8 sm:py-10">
      <h1 className="sr-only">Finalizar pedido</h1>
      <CheckoutStepper current={step} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          {step === 1 && (
            <form onSubmit={goToAddress} noValidate className="surface p-5 sm:p-7">
              <p className="eyebrow flex items-center gap-1.5">
                <UserRound className="size-3.5" /> Etapa 1 de 3
              </p>
              <h2 className="mt-2 font-serif text-2xl">Seus dados</h2>
              <p className="mt-1 text-sm text-muted-foreground">Usamos para emitir o PIX e falar com você sobre a entrega.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field
                  className="sm:col-span-2"
                  label="Nome completo"
                  name="fullName"
                  autoComplete="name"
                  value={customer.fullName}
                  onChange={(e) => setC("fullName", e.target.value)}
                  error={errors.fullName}
                  placeholder="Maria Clara da Silva"
                />
                <Field
                  label="E-mail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={customer.email}
                  readOnly
                  aria-readonly
                  error={errors.email}
                  hint="Confirmado na sua conta"
                />
                <Field
                  label="WhatsApp"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={customer.phone}
                  readOnly
                  aria-readonly
                  error={errors.phone}
                  hint="Confirmado por SMS"
                />
                <Field
                  label="CPF"
                  name="cpf"
                  inputMode="numeric"
                  value={customer.cpf}
                  onChange={(e) => setC("cpf", maskCPF(e.target.value))}
                  error={errors.cpf}
                  placeholder="000.000.000-00"
                  hint="Exigido pelo banco para emitir o PIX."
                />
              </div>
              <div className="mt-8 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Continuar para entrega <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={goToPayment} noValidate className="surface p-5 sm:p-7">
              <p className="eyebrow flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Etapa 2 de 3
              </p>
              <h2 className="mt-2 font-serif text-2xl">Endereço de entrega</h2>
              <p className="mt-1 text-sm text-muted-foreground">Enviamos para todo o Brasil com código de rastreio.</p>
              <div className="mt-6 grid grid-cols-6 gap-4">
                <div className="relative col-span-6 sm:col-span-2">
                  <Field
                    label="CEP"
                    name="cep"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={address.cep}
                    onChange={(e) => {
                      const v = maskCEP(e.target.value)
                      setA("cep", v)
                      if (onlyDigits(v).length === 8) lookupCep(v)
                    }}
                    error={errors.cep}
                    placeholder="00000-000"
                  />
                  {cepLoading && <Loader2 className="absolute right-3 top-[38px] size-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="col-span-6 flex items-end pb-3 sm:col-span-4">
                  <a
                    href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Não sei meu CEP
                  </a>
                </div>
                <Field className="col-span-6 sm:col-span-4" label="Rua" name="street" autoComplete="address-line1" value={address.street} onChange={(e) => setA("street", e.target.value)} error={errors.street} />
                <Field className="col-span-3 sm:col-span-2" label="Número" name="number" ref={numberRef} value={address.number} onChange={(e) => setA("number", e.target.value)} error={errors.number} />
                <Field className="col-span-3 sm:col-span-3" label="Complemento" name="complement" autoComplete="address-line2" value={address.complement} onChange={(e) => setA("complement", e.target.value)} placeholder="Opcional" />
                <Field className="col-span-6 sm:col-span-3" label="Bairro" name="neighborhood" value={address.neighborhood} onChange={(e) => setA("neighborhood", e.target.value)} error={errors.neighborhood} />
                <Field className="col-span-4" label="Cidade" name="city" autoComplete="address-level2" value={address.city} onChange={(e) => setA("city", e.target.value)} error={errors.city} />
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="f-state" className="text-[13px] font-medium">UF</label>
                  <select
                    id="f-state"
                    value={address.state}
                    onChange={(e) => setA("state", e.target.value)}
                    aria-invalid={Boolean(errors.state)}
                    className={cn(
                      "h-11 w-full rounded-xl border border-input bg-card px-3 text-[15px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/15",
                      errors.state && "border-destructive",
                    )}
                  >
                    <option value="">--</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                </div>
                <div className="col-span-6 space-y-1.5">
                  <label htmlFor="f-notes" className="text-[13px] font-medium">Observações</label>
                  <textarea
                    id="f-notes"
                    rows={3}
                    maxLength={500}
                    value={address.notes}
                    onChange={(e) => setA("notes", e.target.value)}
                    placeholder="Ponto de referência, mensagem para presente… (opcional)"
                    className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-[15px] outline-none placeholder:text-muted-foreground/70 focus:border-gold focus:ring-2 focus:ring-gold/15"
                  />
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-4" /> Voltar
                </button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Gerar PIX de {formatBRL(cart.total)} <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <>
              {pix ? (
                <PixPayment pix={pix} onSimulate={simulate} simulating={simulating} onRegenerate={regenerate} />
              ) : (
                <div className="surface flex min-h-80 flex-col items-center justify-center p-8 text-center">
                  {creating ? (
                    <>
                      <Loader2 className="size-7 animate-spin text-gold" />
                      <p className="mt-4 font-serif text-xl">Gerando seu PIX…</p>
                    </>
                  ) : (
                    <>
                      <p className="font-serif text-xl">Não foi possível gerar o PIX</p>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{createError}</p>
                      <div className="mt-5 flex gap-3">
                        <button type="button" onClick={() => setStep(Object.keys(errors).length ? 1 : 2)} className="rounded-full border border-border px-5 py-2.5 text-sm">
                          Revisar dados
                        </button>
                        <button type="button" onClick={createPix} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">
                          Tentar novamente
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {pix && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Pedido <strong>{pix.orderId}</strong> • Guarde este número para acompanhar sua entrega.
                </p>
              )}
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <OrderSummary lines={lines} subtotal={cart.subtotal} shipping={cart.shipping} />
          {step >= 2 && customer.fullName && addressComplete && <AddressCard name={customer.fullName} address={address} />}
          <ProtectedCard />
        </aside>
      </div>
    </div>
  )
}

function SuccessScreen({
  orderId,
  lines,
  subtotal,
  shipping,
  email,
  name,
}: {
  orderId: string
  lines: SummaryLine[]
  subtotal: number
  shipping: number
  email: string
  name: string
}) {
  return (
    <div className="container-k py-12 sm:py-16">
      <div className="surface mx-auto max-w-2xl p-6 text-center sm:p-10">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
          <Check className="size-8" />
        </span>
        <p className="eyebrow mt-6">Pagamento confirmado</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
          Obrigado{name ? `, ${name.split(" ")[0]}` : ""}! Sua devoção está a caminho.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Recebemos seu PIX. O pedido <strong className="text-foreground">{orderId}</strong> já está sendo preparado com
          carinho e será enviado em {storeConfig.shipping.estimate}.{email && <> Enviaremos o rastreio para {email}.</>}
        </p>
        <ul className="mt-8 space-y-2 text-left text-sm">
          {lines.map((l) => (
            <li key={l.slug} className="flex justify-between rounded-lg bg-secondary/60 px-4 py-2.5">
              <span>
                {l.quantity}× {l.name}
              </span>
              <span>{formatBRL(l.price * l.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between px-4 pt-2 font-medium">
            <span>Total pago {shipping === 0 && <span className="font-normal text-muted-foreground">(frete grátis)</span>}</span>
            <span className="font-serif text-lg">{formatBRL(subtotal + shipping)}</span>
          </li>
        </ul>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
            Voltar à loja
          </Link>
          <a
            href={whatsappLink(`Olá! Acabei de fazer o pedido ${orderId}.`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm"
          >
            <MessageCircle className="size-4" /> Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
