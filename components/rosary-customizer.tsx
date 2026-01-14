"use client"

import { useState } from "react"
import Image from "next/image"

type Material = "madeira" | "pedra" | "cristal" | "ouro" | "prata"
type Color = "natural" | "preto" | "branco" | "azul" | "vermelho"
type Crucifix = "classico" | "moderno" | "ornamentado"

interface CustomRosary {
  material: Material
  color: Color
  crucifix: Crucifix
}

const materials = [
  { id: "madeira" as Material, name: "Madeira", price: 89, image: "/handmade-wooden-rosary-beads-close-up.jpg" },
  { id: "pedra" as Material, name: "Pedra Natural", price: 149, image: "/natural-stone-rosary-beads.jpg" },
  { id: "cristal" as Material, name: "Cristal", price: 249, image: "/crystal-rosary-beads-elegant.jpg" },
  { id: "prata" as Material, name: "Prata 925", price: 449, image: "/silver-rosary-beads-luxury.jpg" },
  { id: "ouro" as Material, name: "Ouro", price: 899, image: "/gold-pearl-rosary-beads-luxury-white-background.jpg" },
]

const colors = [
  { id: "natural" as Color, name: "Natural", hex: "#D4A574" },
  { id: "preto" as Color, name: "Preto", hex: "#1a1a1a" },
  { id: "branco" as Color, name: "Branco", hex: "#f5f5f5" },
  { id: "azul" as Color, name: "Azul", hex: "#1e40af" },
  { id: "vermelho" as Color, name: "Vermelho", hex: "#991b1b" },
]

const crucifixes = [
  { id: "classico" as Crucifix, name: "Clássico", price: 0 },
  { id: "moderno" as Crucifix, name: "Moderno", price: 50 },
  { id: "ornamentado" as Crucifix, name: "Ornamentado", price: 120 },
]

export function RosaryCustomizer() {
  const [customRosary, setCustomRosary] = useState<CustomRosary>({
    material: "madeira",
    color: "natural",
    crucifix: "classico",
  })

  const selectedMaterial = materials.find((m) => m.id === customRosary.material)!
  const selectedCrucifix = crucifixes.find((c) => c.id === customRosary.crucifix)!
  const totalPrice = selectedMaterial.price + selectedCrucifix.price

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-12 pb-8 text-center">
        <h1 className="text-5xl md:text-7xl font-semibold text-black mb-4">Crie seu Terço</h1>
        <p className="text-xl md:text-2xl text-gray-600">Personalize cada detalhe para criar algo único</p>
      </section>

      {/* Main Customizer */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Preview */}
          <div className="sticky top-24">
            <div className="bg-gray-50 rounded-3xl p-12 aspect-square flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src={selectedMaterial.image || "/placeholder.svg"}
                  alt={selectedMaterial.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Seu terço personalizado</p>
              <p className="text-4xl font-semibold text-black">R$ {totalPrice}</p>
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-12">
            {/* Material Selection */}
            <div>
              <h2 className="text-2xl font-semibold text-black mb-6">Material</h2>
              <div className="grid grid-cols-2 gap-4">
                {materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => setCustomRosary({ ...customRosary, material: material.id })}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      customRosary.material === material.id
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <p className="font-semibold text-black mb-1">{material.name}</p>
                    <p className="text-sm text-gray-600">R$ {material.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h2 className="text-2xl font-semibold text-black mb-6">Cor</h2>
              <div className="flex gap-4">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setCustomRosary({ ...customRosary, color: color.id })}
                    className={`flex flex-col items-center gap-2 ${
                      customRosary.color === color.id ? "opacity-100" : "opacity-50 hover:opacity-75"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-2 ${
                        customRosary.color === color.id ? "border-black" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-xs text-gray-600">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Crucifix Selection */}
            <div>
              <h2 className="text-2xl font-semibold text-black mb-6">Crucifixo</h2>
              <div className="grid grid-cols-3 gap-4">
                {crucifixes.map((crucifix) => (
                  <button
                    key={crucifix.id}
                    onClick={() => setCustomRosary({ ...customRosary, crucifix: crucifix.id })}
                    className={`p-6 rounded-2xl border-2 transition-all text-center ${
                      customRosary.crucifix === crucifix.id
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <p className="font-semibold text-black mb-1 text-sm">{crucifix.name}</p>
                    <p className="text-xs text-gray-600">
                      {crucifix.price === 0 ? "Incluído" : `+R$ ${crucifix.price}`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Add to Cart Button */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-full transition-colors text-lg">
              Adicionar ao carrinho - R$ {totalPrice}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
