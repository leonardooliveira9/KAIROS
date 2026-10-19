import type { Metadata } from "next"
import { SectionHeading } from "@/components/site/section-heading"
import { RosaryCustomizer } from "@/components/site/rosary-customizer"
import { NAME_PRICE } from "@/lib/customizer"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"

export const metadata: Metadata = {
  title: "Monte seu Terço",
  description: `Escolha a cor das contas, o nome gravado, o crucifixo e a medalha. A partir de ${formatBRL(storeConfig.unitPrice)}.`,
}

export default function PersonalizarPage() {
  return (
    <section className="py-14 sm:py-20">
      <div className="container-k">
        <SectionHeading
          as="h1"
          eyebrow="Feito para você"
          title="Monte seu Terço"
          description={`Escolha cada detalhe e acompanhe a prévia. ${formatBRL(storeConfig.unitPrice)} por terço, mais ${formatBRL(NAME_PRICE)} se quiser um nome gravado.`}
        />
        <RosaryCustomizer />
      </div>
    </section>
  )
}
