const materials = [
  {
    title: "Madeiras Nobres",
    description: "Mogno, jacarandá e cedro cuidadosamente selecionados",
    icon: "🌳",
  },
  {
    title: "Cristais Naturais",
    description: "Quartzo, ametista e cristal de rocha autênticos",
    icon: "💎",
  },
  {
    title: "Metais Premium",
    description: "Prata 925 e banho de ouro para crucifixos",
    icon: "✨",
  },
]

export function MaterialsSection() {
  return (
    <section id="materiais" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h3 className="text-5xl font-semibold tracking-tight text-balance mb-4">Materiais de excelência</h3>
          <p className="text-xl text-muted-foreground">Qualidade que você pode sentir</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {materials.map((material) => (
            <div key={material.title} className="text-center">
              <div className="text-6xl mb-6">{material.icon}</div>
              <h4 className="text-2xl font-semibold mb-3">{material.title}</h4>
              <p className="text-muted-foreground leading-relaxed">{material.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
