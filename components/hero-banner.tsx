export function HeroBanner() {
  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      <img
        src="/elegant-wooden-rosary-beads-on-dark-minimalist-bac.jpg"
        alt="Terços artesanais"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/50" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-background mb-4 text-balance">Terços Artesanais</h1>
        <p className="text-lg md:text-xl text-background/90 max-w-2xl mb-8 text-pretty">
          Peças únicas feitas à mão com materiais nobres. Fé, tradição e qualidade em cada detalhe.
        </p>
        <a
          href="#produtos"
          className="bg-background text-foreground px-8 py-3 rounded-full font-medium hover:bg-background/90 transition-colors"
        >
          Ver Produtos
        </a>
      </div>
    </section>
  )
}
