"use client"

import { ProductCard } from "./product-card"
import type { Product } from "@/contexts/cart-context"

const products: Product[] = [
  {
    id: "1",
    name: "Terço Clássico em Madeira",
    price: 89.9,
    image: "/wooden-rosary-beads-elegant-lighting.jpg",
    description: "Terço artesanal em madeira nobre com acabamento refinado.",
  },
  {
    id: "2",
    name: "Terço Premium Ouro e Pérolas",
    price: 299.9,
    image: "/gold-pearl-rosary-beads-luxury-white-background.jpg",
    description: "Peça exclusiva com detalhes em ouro e pérolas naturais.",
  },
  {
    id: "3",
    name: "Terço Exclusivo Diamantes",
    price: 599.9,
    image: "/diamond-platinum-rosary-beads-dark-background.jpg",
    description: "Design sofisticado com acabamento em platina e diamantes.",
  },
  {
    id: "4",
    name: "Terço Artesanal Feito à Mão",
    price: 149.9,
    image: "/handmade-wooden-rosary-beads-close-up.jpg",
    description: "Cada peça é única, feita com dedicação por artesãos.",
  },
  {
    id: "5",
    name: "Terço de Prata",
    price: 199.9,
    image: "/silver-rosary-beads-luxury.jpg",
    description: "Elegância atemporal em prata de lei 925.",
  },
  {
    id: "6",
    name: "Terço de Pedras Naturais",
    price: 129.9,
    image: "/natural-stone-rosary-beads.jpg",
    description: "Combinação perfeita de natureza e espiritualidade.",
  },
  {
    id: "7",
    name: "Terço Infantil Colorido",
    price: 59.9,
    image: "/colorful-childrens-rosary-beads.jpg",
    description: "Design especial para os pequenos fiéis.",
  },
  {
    id: "8",
    name: "Terço Cristal Luxo",
    price: 249.9,
    image: "/crystal-rosary-beads-luxury-minimal.jpg",
    description: "Cristais selecionados com brilho incomparável.",
  },
]

export function ProductsSection() {
  return (
    <section id="produtos" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Nossos Produtos</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubra nossa coleção de terços artesanais, feitos com amor e dedicação para acompanhar seus momentos de
            fé.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
