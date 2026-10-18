"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.replace("/admin/pedidos")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="surface w-full max-w-sm p-8">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-gold-soft text-gold-strong">
          <Lock className="size-5" />
        </span>
        <h1 className="mt-5 font-serif text-2xl">Painel Kairos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesso restrito à administração da loja.</p>
        <label htmlFor="password" className="mt-6 block text-[13px] font-medium">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-xl border border-input bg-card px-3.5 outline-none focus:border-gold focus:ring-2 focus:ring-gold/15"
        />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading && <Loader2 className="size-4 animate-spin" />} Entrar
        </button>
      </form>
    </main>
  )
}
