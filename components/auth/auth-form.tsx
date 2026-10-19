"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Field } from "@/components/checkout/field"
import { useAuth, type SessionUser } from "@/contexts/auth-context"
import { firebaseConfigured } from "@/lib/firebase-client"
import { safeNext } from "@/lib/utils"
import { GoogleButton } from "./google-button"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter()
  const params = useSearchParams()
  const { setUser } = useAuth()
  // login volta à página inicial; conta nova vai a /conta, onde confirma e-mail e celular
  const next = safeNext(params.get("next"), mode === "login" ? "/" : "/conta")
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const isLogin = mode === "login"

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }))
  }

  const finish = (user: SessionUser) => {
    setUser(user)
    router.replace(next)
    router.refresh()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email: form.email, password: form.password } : form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors(data.fields ?? {})
        throw new Error(data.error)
      }
      finish(data.user)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Não foi possível continuar.")
      setLoading(false)
    }
  }

  const otherHref = `${isLogin ? "/cadastrar" : "/entrar"}${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`

  return (
    <form onSubmit={submit} noValidate className="surface mx-auto w-full max-w-md p-6 sm:p-8">
      <p className="eyebrow">{isLogin ? "Bem-vindo de volta" : "Nova conta"}</p>
      <h1 className="mt-2 font-serif text-3xl">{isLogin ? "Entrar na sua conta" : "Criar sua conta"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isLogin
          ? "Acompanhe seus pedidos e compre mais rápido."
          : "Guarde seus dados para as próximas compras e acompanhe seus pedidos."}
      </p>

      {firebaseConfigured && (
        <div className="mt-6">
          <GoogleButton onSuccess={finish} label={isLogin ? "Entrar com Google" : "Cadastrar com Google"} />
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
            <span className="h-px flex-1 bg-border" /> ou com e-mail <span className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}

      <div className={firebaseConfigured ? "space-y-4" : "mt-6 space-y-4"}>
        {!isLogin && (
          <Field label="Nome" name="name" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        )}
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
        />
        <div className="relative">
          <Field
            label="Senha"
            name="password"
            type={show ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            error={errors.password}
            hint={isLogin ? undefined : "Mínimo de 8 caracteres."}
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
      </div>

      {error && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {isLogin ? "Entrar" : "Criar conta"}
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
        <Link href={otherHref} className="font-medium text-foreground underline underline-offset-4">
          {isLogin ? "Criar conta" : "Entrar"}
        </Link>
      </p>
      {isLogin && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href="/esqueci-senha" className="underline underline-offset-4">Esqueci minha senha</Link>
        </p>
      )}
    </form>
  )
}
