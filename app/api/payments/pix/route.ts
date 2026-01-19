import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { orders } from "../../orders/route"

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY
const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v1"

interface PaymentRequest {
  orderId: string
  amount: number // em reais
}

interface PaymentResponse {
  success: boolean
  orderId?: string
  paymentId?: string
  pixKey?: string
  qrCode?: string
  qrCodeUrl?: string
  error?: string
}

interface AbacatePayResponse {
  id: string
  status: string
  pix: {
    qr_code: string
    qr_code_url: string
    pix_key: string
    expires_at: string
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<PaymentResponse>> {
  try {
    const body = (await request.json()) as PaymentRequest
    const { orderId, amount } = body

    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 }
      )
    }

    const order = orders[orderId]
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    const amountInCents = Math.round(amount * 100)
    const orderTotalInCents = Math.round(order.total * 100)

    if (amountInCents !== orderTotalInCents) {
      return NextResponse.json(
        { success: false, error: "Valor do pedido não corresponde" },
        { status: 400 }
      )
    }

    /**
     * 🔁 Fallback para ambiente sem API Key
     */
    if (!ABACATEPAY_API_KEY) {
      console.warn("[PIX] ABACATEPAY_API_KEY não configurada — usando mock")

      return NextResponse.json({
        success: true,
        orderId,
        paymentId: `MOCK-${orderId}`,
        pixKey: "bac475e5-88ef-4402-8e5b-dde1a7cc5474",
        qrCode: "/qrcode-pix-kairos.jpeg",
        qrCodeUrl: "/qrcode-pix-kairos.jpeg",
      })
    }

    /**
     * 🔗 Criar cobrança PIX na AbacatePay
     */
    const response = await fetch(`${ABACATEPAY_BASE_URL}/pix/charge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInCents,
        description: `Pedido ${orderId} - Kairos Terços`,
        external_id: orderId,
        customer: {
          name: order.clientName,
          email: order.email,
          phone: order.phone,
        },
        expires_in: 3600, // 1 hora
        metadata: {
          order_id: orderId,
          items_count: order.items.length,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[PIX] Erro AbacatePay:", error)
      throw new Error(error?.message || "Erro ao criar cobrança PIX")
    }

    const data: AbacatePayResponse = await response.json()

    // Salvar ID do pagamento no pedido
    order.paymentId = data.id
    order.status = "pending"

    console.log("[PIX] Cobrança criada:", {
      orderId,
      paymentId: data.id,
    })

    return NextResponse.json({
      success: true,
      orderId,
      paymentId: data.id,
      pixKey: data.pix.pix_key,
      qrCode: data.pix.qr_code,
      qrCodeUrl: data.pix.qr_code_url,
    })
  } catch (error) {
    console.error("[PIX] Erro ao criar pagamento:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao processar pagamento PIX",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId é obrigatório" },
        { status: 400 }
      )
    }

    const order = orders[orderId]
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: order.status,
      amount: order.total,
      paymentId: order.paymentId ?? null,
    })
  } catch (error) {
    console.error("[PIX] Erro ao consultar pagamento:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao consultar pagamento" },
      { status: 500 }
    )
  }
}
