import type { Metadata } from "next"
import { Suspense } from "react"
import { SectionHeading } from "@/components/site/section-heading"
import { CatalogGrid } from "@/components/site/catalog-grid"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"

export const metadata: Metadata = {
  title: "Nossa Coleção de Terços",
  description: "Todos os terços artesanais Kairos por R$ 25,00. Filtre por cor e material.",
}

export default function ProdutosPage() {
  return (
    <section className="py-14 sm:py-20">
      <div className="container-k">
        <SectionHeading
          as="h1"
          eyebrow="Artesanato sacro singular"
          title="Nossa Coleção de Terços"
          description={`Peças consagradas pelo cuidado artesanal. Preço único de ${formatBRL(storeConfig.unitPrice)} para qualquer modelo escolhido.`}
        />
        <Suspense>
          <CatalogGrid />
        </Suspense>
      </div>
    </section>
  )
}
