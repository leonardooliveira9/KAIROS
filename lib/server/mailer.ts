import "server-only"
import nodemailer from "nodemailer"
import type { NextRequest } from "next/server"
import { storeConfig } from "@/lib/store-config"

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/**
 * Endereço público da loja usado nos links dos e-mails. Em produção use SITE_URL: o cabeçalho
 * Host pode ser forjado e faria o link de redefinição de senha apontar para outro site.
 */
export function siteUrl(request: NextRequest) {
  const fromEnv = process.env.SITE_URL?.replace(/\/+$/, "")
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === "production") {
    console.warn("[mail] SITE_URL não configurado; usando a origem da requisição nos links")
  }
  return request.nextUrl.origin
}

/** Endereço público configurado em SITE_URL (para e-mails enviados fora de uma ação do próprio cliente) */
export function configuredSiteUrl() {
  return process.env.SITE_URL?.replace(/\/+$/, "") || null
}

/**
 * Envia um e-mail transacional, com uma lista opcional de linhas e um botão de ação opcional.
 * Sem EMAIL_USER/EMAIL_PASSWORD: em desenvolvimento o link vai para o console do servidor.
 */
export async function sendActionEmail(input: {
  to: string
  subject: string
  intro: string
  /** Linhas extras, uma por item (ex.: itens do pedido) */
  lines?: string[]
  actionLabel?: string
  actionUrl?: string
  footer: string
}) {
  const action = input.actionLabel && input.actionUrl ? { label: input.actionLabel, url: input.actionUrl } : null
  const { EMAIL_USER, EMAIL_PASSWORD } = process.env
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[mail:dev] Para: ${input.to}\n[mail:dev] ${input.subject}\n[mail:dev] ${action?.url ?? input.intro}\n`)
      return true
    }
    console.error("[mail] EMAIL_USER/EMAIL_PASSWORD não configurados; e-mail não enviado:", input.subject)
    return false
  }

  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD } })
    await transporter.sendMail({
      from: `${storeConfig.name} <${EMAIL_USER}>`,
      to: input.to,
      subject: input.subject,
      text: [
        input.intro,
        input.lines?.length ? input.lines.map((l) => `• ${l}`).join("\n") : null,
        action ? `${action.label}: ${action.url}` : null,
        input.footer,
      ]
        .filter(Boolean)
        .join("\n\n"),
      html: `<div style="font-family:Georgia,serif;max-width:480px;margin:auto;color:#2b2420">
  <h2 style="font-weight:normal">${escapeHtml(storeConfig.name)}</h2>
  <p>${escapeHtml(input.intro)}</p>
  ${input.lines?.length ? `<ul style="padding-left:18px;color:#444">${input.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>` : ""}
  ${
    action
      ? `<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="background:#2b2420;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none">${escapeHtml(action.label)}</a></p>
  <p style="font-size:13px;color:#777">Se o botão não funcionar, copie este endereço:<br>${escapeHtml(action.url)}</p>`
      : ""
  }
  <p style="font-size:13px;color:#777">${escapeHtml(input.footer)}</p>
</div>`,
    })
    return true
  } catch (err) {
    console.error("[mail]", err)
    return false
  }
}
