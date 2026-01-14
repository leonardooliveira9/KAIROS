import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance mb-6">
          Terço Premium
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance">
          Onde a devoção encontra o design. Artesanalmente criado.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button size="lg" className="rounded-full px-8">
            Explorar Coleção
          </Button>
          <Button size="lg" variant="link" className="text-primary">
            Saiba mais →
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-16">
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-secondary">
          <img src="/elegant-rosary-beads-on-minimalist-white-surface.jpg" alt="Terço Premium" className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  )
}
