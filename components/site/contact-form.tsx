"use client"

import { useState } from "react"
import { Check, Loader2, Send } from "lucide-react"
import { Field } from "@/components/checkout/field"

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setState("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState("sent")
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Não foi possível enviar agora.")
      setState("idle")
    }
  }

  if (state === "sent") {
    return (
      <div className="surface flex flex-col items-center justify-center p-10 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <Check className="size-7" />
        </span>
        <p className="mt-5 font-serif text-2xl">Mensagem enviada!</p>
        <p className="mt-2 text-sm text-muted-foreground">Responderemos em breve no e-mail informado.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="surface space-y-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name="name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Field label="E-mail" name="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="f-message" className="text-[13px] font-medium">Mensagem</label>
        <textarea
          id="f-message"
          required
          rows={6}
          maxLength={2000}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-[15px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/15"
        />
      </div>
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {state === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Enviar mensagem
      </button>
    </form>
  )
}
