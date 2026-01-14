export function FeatureSection() {
  return (
    <section id="artesanal" className="py-24 px-6 bg-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-5xl font-semibold tracking-tight text-balance mb-6">
              Artesanalmente criado. Espiritualmente inspirado.
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Cada terço é cuidadosamente elaborado por artesãos especializados, combinando técnicas tradicionais com
              design contemporâneo.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Materiais selecionados. Acabamento impecável. Devoção em cada detalhe.
            </p>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <img src="/artisan-hands-crafting-rosary-beads-workshop.jpg" alt="Processo artesanal" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  )
}
