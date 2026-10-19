"use client"

import { useEffect, useState } from "react"
import { Check, CircleHelp, Clock, Copy, Info, Loader2, ScanLine, ShieldCheck, Zap } from "lucide-react"
import { toast } from "sonner"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"
import { cn } from "@/lib/utils"

export interface PixInfo {
  orderId: string
  total: number
  payment: {
    mode: "abacatepay" | "static_pix"
    brCode: string
    qrImage: string
    expiresAt: string
    canSimulate: boolean
  }
}

export function useCountdown(expiresAt: string) {
  const [left, setLeft] = useState(() => new Date(expiresAt).getTime() - Date.now())
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(expiresAt).getTime() - Date.now()), 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  const clamped = Math.max(0, left)
  const mm = String(Math.floor(clamped / 60000)).padStart(2, "0")
  const ss = String(Math.floor((clamped % 60000) / 1000)).padStart(2, "0")
  return { expired: left <= 0, label: `${mm}:${ss}` }
}

export function PixPayment({
  pix,
  onSimulate,
  simulating,
  onRegenerate,
}: {
  pix: PixInfo
  onSimulate: () => void
  simulating: boolean
  onRegenerate: () => void
}) {
  const { expired, label } = useCountdown(pix.payment.expiresAt)
  const [copied, setCopied] = useState(false)
  const automatic = pix.payment.mode === "abacatepay"

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.payment.brCode)
      setCopied(true)
      toast.success("Código PIX copiado")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Não foi possível copiar. Selecione o código e copie manualmente.")
    }
  }

  return (
    <section className="surface p-5 sm:p-7" aria-labelledby="pix-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <Zap className="size-3.5" /> Etapa 3 de 3 • Conclusão
          </p>
          <h2 id="pix-title" className="mt-2 font-serif text-2xl sm:text-[1.7rem]">
            Pagamento Instantâneo via PIX
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total da Devoção</p>
          <p className="font-serif text-3xl text-gold-strong sm:text-4xl">{formatBRL(pix.total)}</p>
        </div>
      </div>

      {expired ? (
        <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Este código PIX expirou.</p>
          <p className="mt-1 text-muted-foreground">Gere um novo código para concluir sua compra.</p>
          <button
            type="button"
            onClick={onRegenerate}
            className="mt-3 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
          >
            Gerar novo PIX
          </button>
        </div>
      ) : (
        <p
          role="status"
          className="mt-5 flex items-center gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-[13px] text-warning"
        >
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-warning" />
          </span>
          <span>
            <strong>Aguardando pagamento…</strong>{" "}
            {automatic
              ? "O sistema reconhece sua transferência em até 10 segundos."
              : "Assim que o PIX cair, confirmamos seu pedido por e-mail e WhatsApp."}
          </span>
        </p>
      )}

      <div className={cn("mt-5 grid gap-5 rounded-2xl bg-secondary/60 p-4 sm:grid-cols-[220px_1fr] sm:p-5", expired && "opacity-40")}>
        <div className="flex flex-col items-center rounded-xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pix.payment.qrImage} alt="QR Code PIX do pedido" className="aspect-square w-full max-w-[200px]" />
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-600">
            <ScanLine className="size-3.5" /> Escaneie com a câmera do app do banco
          </p>
        </div>
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs">
            <Clock className="size-3.5 text-gold" /> Expira em <strong className="tabular-nums">{label}</strong>
          </span>
          <h3 className="mt-3 font-serif text-xl">Pague com tranquilidade</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            O valor é compensado em instantes, sem taxas adicionais. Assim que o banco aprovar, você recebe a confirmação
            nesta tela e no seu e-mail.
          </p>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold" /> Beneficiário: {storeConfig.beneficiary}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="pix-code" className="text-[13px] font-medium">
            Código PIX Copia e Cola
          </label>
          <span className="text-muted-foreground">Válido para qualquer aplicativo bancário</span>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="pix-code"
            readOnly
            value={pix.payment.brCode}
            onFocus={(e) => e.currentTarget.select()}
            className="h-12 min-w-0 flex-1 rounded-xl bg-secondary px-4 font-mono text-[13px] text-muted-foreground outline-none"
          />
          <button
            type="button"
            onClick={copy}
            disabled={expired}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado!" : "Copiar código PIX"}
          </button>
        </div>
      </div>

      {pix.payment.canSimulate && !expired && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-gold-line bg-gold-soft/50 px-4 py-2.5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5" /> Ambiente de teste ativo:
          </span>
          <button
            type="button"
            onClick={onSimulate}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-4 py-1.5 text-xs font-medium text-gold-strong ring-1 ring-gold-line hover:bg-card disabled:opacity-60"
          >
            {simulating ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Simular confirmação bancária
          </button>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-secondary/60 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em]">
          <CircleHelp className="size-4 text-gold" /> Como concluir seu pagamento em 3 passos
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            <>Abra o app do seu banco no celular e toque na opção <strong>PIX</strong>.</>,
            <>Escolha <strong>PIX Copia e Cola</strong> ou aponte a câmera para o <strong>QR Code</strong>.</>,
            <>Confirme o valor exato de <strong>{formatBRL(pix.total)}</strong> para <em>Kairos</em>.</>,
          ].map((text, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-card p-3.5 text-[13px] leading-relaxed">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
