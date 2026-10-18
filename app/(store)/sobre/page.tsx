import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Hand, HeartHandshake, Sparkles } from "lucide-react"
import { SectionHeading } from "@/components/site/section-heading"

export const metadata: Metadata = {
  title: "Nossa História",
  description: "Conheça a Kairos, o significado do nome e como cada terço é feito à mão.",
}

const values = [
  { icon: Hand, title: "Feito à mão", text: "Cada nó é dado com atenção. Nenhuma peça sai de uma linha de produção." },
  { icon: HeartHandshake, title: "Acessível a todos", text: "Um preço único e justo, para que a oração caiba em todos os lares." },
  { icon: Sparkles, title: "Beleza que eleva", text: "Acreditamos que o belo conduz ao sagrado — e cuidamos de cada detalhe." },
]

export default function SobrePage() {
  return (
    <>
      <section className="py-14 sm:py-20">
        <div className="container-k grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading as="h1" eyebrow="Nossa história" title="Nasceu do amor pela fé e pelo artesanato." />
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                A Kairos nasceu de um desejo simples: levar fé e esperança através de terços feitos à mão, com o mesmo
                cuidado com que se reza. Cada peça carrega uma história, um propósito e uma oração.
              </p>
              <p>
                Escolhemos as contas, cortamos o cordão e damos cada nó em silêncio, pensando em quem vai receber aquele
                terço. Por isso dizemos que nenhuma peça é igual à outra.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image src="/Terços.jpg" alt="Terços azuis artesanais nas mãos" fill priority sizes="(min-width:1024px) 520px, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-ink py-20 text-white">
        <div className="container-k max-w-3xl text-center">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#c9a96e]">Καιρός</p>
          <h2 className="mt-4 font-serif text-3xl font-normal sm:text-4xl">O tempo de Deus, não o do relógio.</h2>
          <p className="mt-5 leading-relaxed text-white/65">
            Os gregos tinham duas palavras para o tempo. <em>Chronos</em> é o tempo que passa, medido em minutos.{" "}
            <em>Kairós</em> é o momento oportuno — o instante em que a eternidade toca o presente. É esse o tempo que
            queremos que você encontre ao segurar um de nossos terços.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-k">
          <SectionHeading align="center" eyebrow="O que nos move" title="Nossos valores" />
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <li key={title} className="surface p-7">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-gold-soft text-gold-strong">
                  <Icon className="size-5" />
                </span>
                <p className="mt-5 font-serif text-xl">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
            <div className="relative aspect-[5/4] overflow-hidden rounded-3xl">
              <Image src="/artisan-hands-crafting-rosary-beads-workshop.jpg" alt="Ateliê Kairos" fill sizes="(min-width:1024px) 520px, 100vw" className="object-cover" />
            </div>
            <div>
              <p className="eyebrow">O ateliê</p>
              <h2 className="mt-3 font-serif text-3xl">Do nosso ateliê para a sua oração.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Produzimos em pequenas quantidades, por isso algumas cores esgotam rápido. Se não encontrar o modelo que
                procura, fale com a gente — teremos prazer em ajudar.
              </p>
              <Link href="/produtos" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground">
                Ver coleção <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
