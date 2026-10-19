"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Loader2, MessageSquareText, Pencil } from "lucide-react"
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth"
import { Field } from "@/components/checkout/field"
import { useAuth } from "@/contexts/auth-context"
import { firebaseConfigured, firebaseErrorMessage, getFirebaseAuth } from "@/lib/firebase-client"
import { maskPhone, onlyDigits } from "@/lib/format"

const RESEND_SECONDS = 60

export function PhoneVerification({ compact = false }: { compact?: boolean }) {
  const { user, setUser } = useAuth()
  const [phone, setPhone] = useState(user?.phone ? maskPhone(user.phone) : "")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [editing, setEditing] = useState(false)
  const confirmation = useRef<ConfirmationResult | null>(null)
  const verifier = useRef<RecaptchaVerifier | null>(null)
  const containerId = useRef(`recaptcha-${Math.random().toString(36).slice(2)}`).current

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => () => verifier.current?.clear(), [])

  if (!user) return null

  const verified = Boolean(user.phoneVerifiedAt && user.phone) && !editing

  if (verified) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Telefone confirmado: <strong>{maskPhone(user.phone!)}</strong>
        </span>
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs underline underline-offset-4">
          <Pencil className="size-3" /> Trocar número
        </button>
      </div>
    )
  }

  if (!firebaseConfigured) {
    return <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">Verificação por SMS ainda não configurada na loja.</p>
  }

  const sendCode = async () => {
    const digits = onlyDigits(phone)
    if (digits.length !== 11 || digits[2] !== "9") {
      setError("Informe um celular com DDD, ex.: (61) 99999-9999.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const auth = await getFirebaseAuth()
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth")
      if (!verifier.current) {
        // o reCAPTCHA não pode ser desenhado duas vezes no mesmo elemento: cada tentativa ganha um novo
        const host = document.getElementById(containerId)!
        host.replaceChildren()
        const el = document.createElement("div")
        host.appendChild(el)
        verifier.current = new RecaptchaVerifier(auth, el, { size: "invisible" })
      }
      confirmation.current = await signInWithPhoneNumber(auth, `+55${digits}`, verifier.current)
      setStep("code")
      setCode("")
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      if (!(err as { code?: string })?.code) console.error("[sms]", err)
      setError(firebaseErrorMessage(err))
      // o reCAPTCHA não pode ser reutilizado depois de um erro
      try {
        verifier.current?.clear()
      } catch {
        // já removido
      }
      verifier.current = null
    } finally {
      setLoading(false)
    }
  }

  const confirm = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!confirmation.current || code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const cred = await confirmation.current.confirm(code)
      const idToken = await cred.user.getIdToken()
      const auth = await getFirebaseAuth()
      const { signOut } = await import("firebase/auth")
      await signOut(auth).catch(() => null)

      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUser(data.user)
      setEditing(false)
      setStep("phone")
    } catch (err) {
      setError(err instanceof Error && !("code" in err) && err.message ? err.message : firebaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4 rounded-2xl border border-border/70 p-5"}>
      {!compact && (
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-strong">
            <MessageSquareText className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Confirme seu celular</p>
            <p className="text-xs text-muted-foreground">Enviaremos um código por SMS. Usamos o número para falar sobre a entrega.</p>
          </div>
        </div>
      )}

      {step === "phone" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field
            className="flex-1"
            label="Celular"
            name="verify-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(61) 99999-9999"
          />
          <button
            type="button"
            onClick={sendCode}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />} Enviar código
          </button>
        </div>
      ) : (
        <form onSubmit={confirm} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enviamos um código de 6 dígitos para <strong className="text-foreground">{phone}</strong>.{" "}
            <button type="button" onClick={() => setStep("phone")} className="underline underline-offset-4">
              Trocar número
            </button>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field
              className="flex-1"
              label="Código"
              name="verify-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
              placeholder="000000"
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />} Confirmar
            </button>
          </div>
          <button
            type="button"
            onClick={sendCode}
            disabled={cooldown > 0 || loading}
            className="text-xs text-muted-foreground underline underline-offset-4 disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0 ? `Reenviar código em ${cooldown}s` : "Reenviar código"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div id={containerId} />
    </div>
  )
}
