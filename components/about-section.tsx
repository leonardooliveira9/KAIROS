export function AboutSection() {
  return (
    <section id="sobre" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img
              src="/artisan-hands-crafting-rosary-beads-workshop.jpg"
              alt="Artesão trabalhando"
              className="rounded-lg shadow-lg w-full"
            />
            <div className="absolute -bottom-6 -right-6 w-48 h-48 hidden lg:block">
              <img
                src="/elegant-rosary-beads-on-minimalist-white-surface.jpg"
                alt="Terço artesanal"
                className="w-full h-full object-cover rounded-lg shadow-lg border-4 border-background"
              />
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Nossa História</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Há mais de 20 anos, nossa família se dedica à criação de terços artesanais de alta qualidade. Cada peça é
              cuidadosamente elaborada, unindo tradição, fé e arte em um único objeto de devoção.
            </p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Trabalhamos com os melhores materiais - madeiras nobres, pérolas naturais, cristais e metais preciosos -
              para criar terços que serão verdadeiras relíquias familiares, passadas de geração em geração.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-3xl font-bold text-foreground">20+</span>
                <p className="text-sm text-muted-foreground">Anos de tradição</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-foreground">5000+</span>
                <p className="text-sm text-muted-foreground">Clientes satisfeitos</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-foreground">100%</span>
                <p className="text-sm text-muted-foreground">Feito à mão</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
