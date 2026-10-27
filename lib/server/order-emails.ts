import "server-only"
import { after } from "next/server"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"
import { configuredSiteUrl, sendActionEmail } from "./mailer"
import type { Order } from "./orders-store"

/*
 * E-mails do pedido para o cliente: pagamento confirmado e pedido enviado (com o rastreio).
 * O checkout e a tela do PIX prometem essas mensagens.
 */

function itemLines(order: Order) {
  return order.items.map((i) => `${i.quantity}× ${i.name}${i.details ? ` (${i.details})` : ""}`)
}

function sendOrderEmail(order: Order, kind: "paid" | "shipped") {
  const firstName = order.customer.fullName.split(" ")[0]
  const site = configuredSiteUrl()
  const action = site ? { actionLabel: "Ver meu pedido", actionUrl: `${site}/conta` } : {}

  if (kind === "paid") {
    return sendActionEmail({
      to: order.customer.email,
      subject: `Pagamento confirmado — pedido ${order.id}`,
      intro: `Olá, ${firstName}! Recebemos o PIX de ${formatBRL(order.total)} do pedido ${order.id}. Seu pedido já está sendo preparado e será enviado em ${storeConfig.shipping.estimate}.`,
      lines: itemLines(order),
      ...action,
      footer: "Quando o pedido for enviado, mandamos outro e-mail com o código de rastreio.",
    })
  }
  return sendActionEmail({
    to: order.customer.email,
    subject: `Pedido ${order.id} enviado`,
    intro: order.trackingCode
      ? `Olá, ${firstName}! Seu pedido ${order.id} foi enviado. Código de rastreio: ${order.trackingCode}.`
      : `Olá, ${firstName}! Seu pedido ${order.id} foi enviado. Assim que o código de rastreio estiver disponível, avisamos você.`,
    lines: itemLines(order),
    ...action,
    footer: order.trackingCode
      ? "Acompanhe a entrega no site dos Correios com o código acima."
      : `Dúvidas? Fale conosco pelo WhatsApp ${storeConfig.contact.whatsappLabel}.`,
  })
}

/** Envia em segundo plano, sem atrasar a resposta (after: na Vercel a função não é encerrada antes do envio) */
export function notifyOrder(order: Order, kind: "paid" | "shipped") {
  const send = () =>
    sendOrderEmail(order, kind).catch((err) => console.error("[order-email]", order.id, kind, err))
  try {
    after(send)
  } catch {
    // fora de uma requisição (ex.: script): envia direto
    void send()
  }
}
