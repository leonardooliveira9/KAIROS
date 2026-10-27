import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { BadgeCheck } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SectionHeading } from "@/components/site/section-heading"
import { RosaryCustomizer } from "@/components/site/rosary-customizer"
import { NAME_PRICE } from "@/lib/customizer"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"

export const metadata: Metadata = {
  title: "Monte seu Terço",
  description: `Escolha a cor das contas, o nome gravado, o crucifixo e a medalha. A partir de ${formatBRL(storeConfig.unitPrice)}.`,
}

const PROCESS = [
  {
    image: "/handmade-wooden-rosary-beads-close-up.jpg",
    alt: "Contas de terço separadas sobre a mesa",
    eyebrow: "Seleção",
    title: "Contas escolhidas uma a uma",
    text: "Separamos as contas na cor que você escolheu e conferimos cada uma antes da montagem.",
  },
  {
    image: "/artisan-hands-crafting-rosary-beads-workshop.jpg",
    alt: "Mãos de artesã montando um terço",
    eyebrow: "Montagem",
    title: "Feito à mão, conta por conta",
    text: "O terço é montado à mão no nosso ateliê, com o nome, a medalha e o crucifixo do seu pedido.",
  },
  {
    image: "/Terços.jpg",
    alt: "Terços prontos nas mãos",
    eyebrow: "Envio",
    title: "Embalado para presente",
    text: "Seguimos com embalagem para presente e código de rastreio para todo o Brasil.",
  },
]

export default function PersonalizarPage() {
  return (
    <>
      <section className="py-10 sm:py-14">
        <div className="container-k">
          <Breadcrumb>
            <BreadcrumbList className="text-[11px] uppercase tracking-[0.14em]">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Início</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gold">Monte seu terço</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              as="h1"
              eyebrow="Feito para você"
              title="Monte seu Terço"
              description="Escolha cada detalhe com calma: a cor das contas, um nome gravado, o crucifixo e a medalha. A prévia muda a cada escolha."
            />
            <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-gold-line bg-gold-soft px-4 py-3 sm:self-auto">
              <BadgeCheck className="size-5 text-gold" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gold-strong">Valor único</p>
                <p className="font-serif text-xl leading-tight">
                  {formatBRL(storeConfig.unitPrice)}
                  <span className="ml-1.5 font-sans text-xs text-muted-foreground">
                    + {formatBRL(NAME_PRICE)} com nome
                  </span>
                </p>
              </div>
            </div>
          </div>

          <RosaryCustomizer />
        </div>
      </section>

      <section aria-labelledby="processo-titulo" className="border-t border-border/70 bg-secondary/40 py-16 sm:py-20">
        <div className="container-k">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Do ateliê para você</p>
            <h2 id="processo-titulo" className="mt-3 font-serif text-3xl font-normal leading-tight sm:text-4xl">
              Como seu terço ganha vida
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Cada terço personalizado é feito sob encomenda, depois que o pagamento é confirmado.
            </p>
          </div>

          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {PROCESS.map((p, i) => (
              <li key={p.title} className="surface overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <Image src={p.image} alt={p.alt} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-gold">
                    <span className="font-serif text-base normal-case tracking-normal text-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px w-6 bg-gold-line" aria-hidden />
                    {p.eyebrow}
                  </p>
                  <h3 className="mt-3 font-serif text-xl">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <figure className="mx-auto mt-12 max-w-2xl rounded-2xl border border-border/70 bg-card px-6 py-8 text-center">
            <span aria-hidden className="font-serif text-2xl text-gold-line">
              ✣
            </span>
            <blockquote className="mt-3 font-serif text-lg italic leading-relaxed sm:text-xl">
              Não o tempo do relógio, mas o tempo da alma.
            </blockquote>
            <figcaption className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Kairos · Terços artesanais
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  )
}
