import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, ChevronRight, ShieldCheck, ShoppingCart } from "lucide-react"
import { ProductGallery } from "@/components/site/product-gallery"
import { ProductPurchase } from "@/components/site/product-purchase"
import { getProduct, products } from "@/lib/products"
import { formatBRL } from "@/lib/format"

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [product.images[0]] },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 2)

  return (
    <>
      <div className="container-k py-8 sm:py-10">
        <nav aria-label="Trilha" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-foreground">Início</Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li>
              <Link href="/produtos" className="hover:text-foreground">Coleção Artesanal</Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li aria-current="page" className="text-foreground">{product.name}</li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <ProductGallery images={product.images} name={product.name} />
            <div className="mt-5 flex gap-4 rounded-2xl border border-border/60 bg-card p-5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold" />
              <div>
                <p className="text-sm font-medium">Garantia Artesanal Kairos</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Cada peça é montada individualmente por mãos orantes. Não existem duas contas idênticas, tornando seu
                  terço singular e eterno.
                </p>
              </div>
            </div>
          </div>

          <ProductPurchase product={product} />
        </div>
      </div>

      <section aria-label="Destaques" className="mt-10 border-y border-border/70 bg-secondary/50">
        <ol className="container-k grid gap-8 py-12 md:grid-cols-3">
          {product.highlights.map((h, i) => (
            <li key={h.title}>
              <p className="font-serif text-xl text-gold-strong">
                {String(i + 1).padStart(2, "0")}. {h.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{h.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-k">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Harmonia & devoção</p>
              <h2 className="mt-3 font-serif text-3xl font-normal">Outras peças que você pode amar</h2>
            </div>
            <Link href="/produtos" className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-strong hover:underline">
              Ver todo o acervo artesanal <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/produtos/${p.slug}`}
                className="group grid grid-cols-[42%_1fr] overflow-hidden rounded-2xl border border-border/60 bg-card transition-shadow hover:shadow-lg"
              >
                <div className="relative min-h-44">
                  <Image src={p.images[0]} alt={p.name} fill sizes="(min-width:768px) 240px, 45vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider">
                    {p.badge}
                  </span>
                </div>
                <div className="flex flex-col p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Feito à mão</p>
                  <p className="mt-2 font-serif text-xl">{p.name}</p>
                  <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">{p.description}</p>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Preço único</p>
                      <p className="font-serif text-lg">{formatBRL(p.price)}</p>
                    </div>
                    <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <ShoppingCart className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
