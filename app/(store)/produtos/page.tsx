import type { Metadata } from "next"
import { Suspense } from "react"
import { SectionHeading } from "@/components/site/section-heading"
import { CatalogGrid } from "@/components/site/catalog-grid"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"
import { listProducts, toProduct } from "@/lib/server/products-store"

export const metadata: Metadata = {
  title: "Nossa Coleção de Terços",
  description: "Todos os terços artesanais Kairos por R$ 25,00. Filtre por cor e material.",
}
// o catálogo vem do banco e muda pelo admin
export const dynamic = "force-dynamic"

export default async function ProdutosPage() {
  const products = (await listProducts()).map(toProduct)
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
          <CatalogGrid products={products} />
        </Suspense>
      </div>
    </section>
  )
}
