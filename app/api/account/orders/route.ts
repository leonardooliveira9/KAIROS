import { NextResponse, type NextRequest } from "next/server"
import QRCode from "qrcode"
import { listOrdersForUser, publicOrder, type Order } from "@/lib/server/orders-store"
import { syncPayment } from "@/lib/server/payment-sync"
import { requireRole } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Pedidos da conta logada, com o status em dia:
 * - PIX da AbacatePay ainda pendente é reconferido na AbacatePay (pode ter sido pago ou expirado);
 * - PIX pendente e ainda válido volta com o código para o cliente terminar de pagar;
 * - PIX pendente e vencido vem marcado como `paymentExpired` (o pedido continua no painel,
 *   porque um PIX estático pago com atraso ainda pode ser confirmado à mão pelo admin);
 * - PIX da AbacatePay que venceu vira "canceled" na sincronização, mas também volta como
 *   `paymentExpired`, para o cliente ver "PIX expirado" e não um cancelamento sem explicação.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request)
  if (auth instanceof NextResponse) return auth

  const found = await listOrdersForUser(auth.id, auth.emailVerifiedAt ? auth.email : undefined)
  const orders = await Promise.all(found.map(accountOrder))
  return NextResponse.json({ orders })
}

async function accountOrder(stored: Order) {
  // uma falha ao reconferir um pedido não pode derrubar a lista inteira
  const order =
    stored.status === "awaiting_payment"
      ? await syncPayment(stored).catch((err) => {
          console.error("[account/orders] falha ao sincronizar", stored.id, err)
          return stored
        })
      : stored
  const pending = order.status === "awaiting_payment"
  const paymentExpired =
    !order.paidAt &&
    ((pending && new Date(order.payment.expiresAt).getTime() <= Date.now()) ||
      (order.status === "canceled" && order.canceledReason === "payment_expired"))

  return {
    ...publicOrder(order),
    paymentExpired,
    // só para quem ainda pode pagar: código copia e cola + QR gerado a partir dele
    pix:
      pending && !paymentExpired
        ? {
            brCode: order.payment.brCode,
            qrImage: await QRCode.toDataURL(order.payment.brCode, { margin: 1, width: 320, errorCorrectionLevel: "M" }),
            expiresAt: order.payment.expiresAt,
          }
        : null,
  }
}
