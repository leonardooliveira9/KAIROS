import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowRight, BadgeCheck, Hand, Package, ShieldCheck, Sparkles, Star, Truck, Zap } from "lucide-react"
import { ProductCard } from "@/components/site/product-card"
import { SectionHeading } from "@/components/site/section-heading"
import { products } from "@/lib/products"
import { testimonials } from "@/lib/testimonials"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"

const trust = [
  { icon: Hand, title: "Feito à mão", text: "Artesanal ponto a ponto, com nós firmes e toque aveludado." },
  { icon: Zap, title: "Pagamento via PIX", text: "Aprovação instantânea, segura e confirmação imediata." },
  { icon: Package, title: "Envio para todo o Brasil", text: "Embalagem de afeto, perfumada e pronta para presentear." },
]

export default function HomePage() {
  const featured = products.slice(0, 3)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-gold-soft/70 blur-3xl"
        />
        <div className="container-k relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gold-strong">
              <span className="size-1.5 rounded-full bg-gold" /> Feito à mão • Momento de oração
            </p>
            <h1 className="mt-6 font-serif text-[2.6rem] font-normal leading-[1.05] tracking-tight text-balance sm:text-6xl">
              Terços artesanais com amor e fé.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Cada conta entrelaçada manualmente com profunda devoção. Peças exclusivas e atemporais, esculpidas para
              acompanhar com dignidade a sua jornada íntima de espiritualidade e serenidade.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#colecao"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                Ver terços <ArrowDown className="size-4" />
              </Link>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:bg-secondary"
              >
                Nossa história
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-gold" /> Edições limitadas
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-gold" /> Entrega segura & rastreável
              </li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative ml-auto aspect-[4/5] w-[78%] overflow-hidden rounded-3xl shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
              <Image src="/Terço-preto.jpg" alt="Terço preto artesanal" fill priority sizes="(min-width:1024px) 420px, 80vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 left-0 aspect-square w-[52%] overflow-hidden rounded-3xl border-[6px] border-background shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
              <Image src="/Terços.jpg" alt="Mãos segurando terços azuis" fill priority sizes="(min-width:1024px) 280px, 50vw" className="object-cover" />
            </div>
            <div className="absolute bottom-10 right-2 flex items-center gap-2.5 rounded-full border border-border/70 bg-card/95 py-2 pl-2 pr-4 shadow-lg backdrop-blur sm:right-6">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-gold-soft text-gold-strong">
                <BadgeCheck className="size-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Acabamento</span>
                <span className="block text-xs font-medium">Cordão de alta força</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa de confiança */}
      <section aria-label="Diferenciais" className="border-y border-border/70 bg-card">
        <ul className="container-k grid gap-6 py-8 sm:grid-cols-3">
          {trust.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-gold">
                <Icon className="size-[18px]" />
              </span>
              <div>
                <p className="font-serif text-lg leading-tight">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Coleção */}
      <section id="colecao" className="scroll-mt-20 py-20 sm:py-24">
        <div className="container-k">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Coleção essencial"
              title="Instrumentos de contemplação diária."
              description={`O mesmo apreço, a mesma reverência. Valor unificado de ${formatBRL(storeConfig.unitPrice)} em todas as nossas criações devocionais.`}
            />
            <Link href="/produtos" className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              {featured.length} de {products.length} peças • Ver coleção completa <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <ProductCard key={p.slug} product={p} priority={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Banner de preço */}
      <section className="bg-ink py-20 text-center text-white sm:py-24">
        <div className="container-k">
          <span aria-hidden className="mx-auto block font-serif text-2xl text-gold-line">
            ✣
          </span>
          <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-[#c9a96e]">Kairós • O tempo oportuno</p>
          <h2 className="mt-4 font-serif text-3xl font-normal sm:text-4xl">
            Todos os terços por apenas <span className="text-[#c9a96e]">{formatBRL(storeConfig.unitPrice)}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/60">
            Acreditamos que a oração e o silêncio devem ser universais. Praticamos um valor único e acessível para que
            este elo de amor e paz encontre refúgio em todos os lares.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90"
            >
              Comprar agora
            </Link>
            <span className="flex items-center gap-2 text-xs text-white/50">
              <Truck className="size-4 text-[#c9a96e]" /> Pronta entrega em todo o território nacional
            </span>
          </div>
        </div>
      </section>

      {/* Significado */}
      <section className="py-20 sm:py-28">
        <div className="container-k grid items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-3xl">
              <Image
                src="/artisan-hands-crafting-rosary-beads-workshop.jpg"
                alt="Mãos de artesã montando um terço"
                fill
                sizes="(min-width:1024px) 540px, 100vw"
                className="object-cover"
              />
            </div>
            <p className="absolute -bottom-5 left-1/2 w-[85%] -translate-x-1/2 rounded-xl border border-border/70 bg-card px-5 py-3 text-center font-serif text-[15px] italic shadow-lg sm:w-auto sm:whitespace-nowrap">
              “Não o tempo do relógio, mas o tempo da alma.”
            </p>
          </div>
          <div>
            <SectionHeading eyebrow="Origem & propósito" title="O significado sagrado de Kairós." />
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                Enquanto <em>Chronos</em> mede o passar cronológico e apressado dos segundos terrenos,{" "}
                <strong className="font-medium text-foreground">Kairós</strong> representa o tempo de Deus: o instante
                onde a eternidade toca o presente, o momento oportuno de silêncio, recolhimento e oração sincera.
              </p>
              <p>
                Cada terço Kairos não é mero acessório religioso. É um convite tangível para pausar o mundo exterior,
                acolher as contas nas pontas dos dedos e permitir que o coração respire em paz profunda.
              </p>
            </div>
            <Link
              href="/sobre"
              className="mt-8 inline-flex items-center gap-2 border-b border-foreground/30 pb-1 text-xs font-medium uppercase tracking-[0.14em] hover:border-foreground"
            >
              Conheça nosso ateliê <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      {testimonials.length > 0 && (
        <section className="border-t border-border/70 bg-secondary/50 py-20 sm:py-24">
          <div className="container-k">
            <SectionHeading
              align="center"
              eyebrow="Vozes da nossa família"
              title="A bênção de quem já reza conosco."
              description="Histórias de consolo, intimidade com Nossa Senhora e gratidão compartilhada."
            />
            <ul className="mt-12 grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <li key={t.name} className="flex flex-col rounded-2xl border border-border/60 bg-card p-6">
                  <div className="flex gap-0.5 text-gold" aria-label="5 de 5 estrelas">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 font-serif text-[16px] italic leading-relaxed">“{t.text}”</blockquote>
                  <p className="mt-6 text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
