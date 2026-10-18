import type { Metadata } from "next"
import { CheckoutFlow } from "@/components/checkout/checkout-flow"

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false },
}

export default function CheckoutPage() {
  return <CheckoutFlow />
}
