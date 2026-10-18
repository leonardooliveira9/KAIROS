import type { Metadata } from "next"
import { SectionHeading } from "@/components/site/section-heading"
import { OrderTracker } from "@/components/site/order-tracker"

export const metadata: Metadata = { title: "Acompanhar pedido", robots: { index: false } }

export default function PedidoPage() {
  return (
    <section className="py-14 sm:py-20">
      <div className="container-k">
        <SectionHeading
          as="h1"
          eyebrow="Meu pedido"
          title="Acompanhe sua devoção."
          description="Informe o número do pedido (ex.: KRS-AB12CD34) e o e-mail usado na compra."
        />
        <OrderTracker />
      </div>
    </section>
  )
}
