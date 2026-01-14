import { Button } from "@/components/ui/button"

const products = [
  {
    name: "Terço Clássico",
    price: "R$ 199",
    description: "Madeira nobre. Acabamento artesanal.",
    image: "/wooden-rosary-beads-elegant-lighting.jpg",
  },
  {
    name: "Terço Premium",
    price: "R$ 399",
    description: "Cristal natural. Design minimalista.",
    image: "/crystal-rosary-beads-luxury-minimal.jpg",
  },
  {
    name: "Terço Exclusivo",
    price: "R$ 799",
    description: "Pedras semipreciosas. Edição limitada.",
    image: "/gemstone-rosary-beads-premium-elegant.jpg",
  },
]

export function ProductLineup() {
  return (
    <section id="colecao" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h3 className="text-5xl md:text-6xl font-semibold tracking-tight text-balance mb-4">Escolha seu caminho</h3>
          <p className="text-xl text-muted-foreground">Cada terço é uma obra de arte única</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.name} className="group">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary mb-6">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="text-center">
                <h4 className="text-2xl font-semibold mb-2">{product.name}</h4>
                <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                <p className="text-lg font-semibold mb-4">{product.price}</p>
                <Button variant="link" className="text-primary">
                  Comprar →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
