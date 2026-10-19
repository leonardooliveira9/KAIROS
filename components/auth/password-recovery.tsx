"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Field } from "@/components/checkout/field"

const buttonClass =
  "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || "Não foi possível continuar."), { fields: data.fields })
  return data
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await post("/api/auth/forgot-password", { email })
      setSent(data.message)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="surface mx-auto w-full max-w-md p-6 sm:p-8">
      <p className="eyebrow">Recuperar acesso</p>
      <h1 className="mt-2 font-serif text-3xl">Esqueci minha senha</h1>
      {sent ? (
        <div className="mt-6 flex gap-3 rounded-xl bg-success-soft p-4 text-sm text-success" role="status">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{sent} Confira também a caixa de spam. O link vale por 1 hora.</p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
          </p>
          <div className="mt-6">
            <Field label="E-mail" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading && <Loader2 className="size-4 animate-spin" />} Enviar link
          </button>
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Lembrou?{" "}
        <Link href="/entrar" className="font-medium text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await post("/api/auth/reset-password", { token, password })
      setDone(true)
    } catch (err) {
      setFieldError((err as { fields?: Record<string, string> }).fields?.password)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="surface mx-auto w-full max-w-md p-6 sm:p-8">
        <h1 className="font-serif text-3xl">Link incompleto</h1>
        <p className="mt-2 text-sm text-muted-foreground">Abra o link exatamente como chegou no e-mail ou peça um novo.</p>
        <Link href="/esqueci-senha" className={buttonClass}>
          Pedir novo link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="surface mx-auto w-full max-w-md p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <h1 className="mt-4 font-serif text-3xl">Senha redefinida</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Por segurança, encerramos as sessões abertas em todos os aparelhos. Entre com a nova senha.
        </p>
        <Link href="/entrar" className={buttonClass}>
          Entrar
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="surface mx-auto w-full max-w-md p-6 sm:p-8">
      <p className="eyebrow">Recuperar acesso</p>
      <h1 className="mt-2 font-serif text-3xl">Criar nova senha</h1>
      <div className="relative mt-6">
        <Field
          label="Nova senha"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError}
          hint="Mínimo de 8 caracteres."
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
      <button type="submit" disabled={loading} className={buttonClass}>
        {loading && <Loader2 className="size-4 animate-spin" />} Salvar nova senha
      </button>
      {error && !fieldError && (
        <p className="mt-4 text-center text-sm">
          <Link href="/esqueci-senha" className="underline underline-offset-4">
            Pedir novo link
          </Link>
        </p>
      )}
    </form>
  )
}
