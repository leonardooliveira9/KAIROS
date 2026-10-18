import { NextResponse, type NextRequest } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"
import { storeConfig } from "@/lib/store-config"

export const runtime = "nodejs"

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(5).max(2000),
})

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

const hits = new Map<string, number[]>()

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local"
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000)
  if (recent.length >= 5) {
    return NextResponse.json({ error: "Muitas mensagens. Tente novamente mais tarde." }, { status: 429 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha nome, e-mail e uma mensagem." }, { status: 400 })
  }

  const { EMAIL_USER, EMAIL_PASSWORD, CONTACT_EMAIL_TO } = process.env
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    return NextResponse.json(
      { error: `Formulário indisponível no momento. Fale conosco pelo WhatsApp ${storeConfig.contact.whatsappLabel}.` },
      { status: 503 },
    )
  }

  const { name, email, message } = parsed.data
  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD } })
    await transporter.sendMail({
      from: EMAIL_USER,
      to: CONTACT_EMAIL_TO || EMAIL_USER,
      replyTo: email,
      subject: `Contato pelo site: ${name.slice(0, 60)}`,
      text: `Nome: ${name}\nE-mail: ${email}\n\n${message}`,
      html: `<p><strong>Nome:</strong> ${escapeHtml(name)}</p><p><strong>E-mail:</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    })
    recent.push(now)
    hits.set(ip, recent)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[contact]", err)
    return NextResponse.json({ error: "Não foi possível enviar agora. Tente pelo WhatsApp." }, { status: 502 })
  }
}
