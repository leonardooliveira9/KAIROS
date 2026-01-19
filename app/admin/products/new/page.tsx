"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ProductVariation {
  id: string
  type: string
  value: string
  price: number
  stock: number
}

export default function NewProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: 0,
    cost: 0,
    sku: "",
    stock: 0,
    image: "/diverse-products-still-life.png",
  })

  const [variations, setVariations] = useState<ProductVariation[]>([])
  const [newVariation, setNewVariation] = useState({
    type: "",
    value: "",
    price: 0,
    stock: 0,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "cost" || name === "stock" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleAddVariation = () => {
    if (newVariation.type && newVariation.value) {
      const variation: ProductVariation = {
        id: Math.random().toString(36).substr(2, 9),
        ...newVariation,
        price: Number.parseFloat(newVariation.price.toString()),
        stock: Number.parseInt(newVariation.stock.toString()),
      }
      setVariations([...variations, variation])
      setNewVariation({ type: "", value: "", price: 0, stock: 0 })
    }
  }

  const handleRemoveVariation = (id: string) => {
    setVariations(variations.filter((v) => v.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const product = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      images: [formData.image],
      variations,
      active: true,
      createdAt: new Date().toISOString(),
    }

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      })

      if (response.ok) {
        router.push("/admin/dashboard?tab=products")
      }
    } catch (error) {
      console.error("[v0] Erro ao criar produto:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard?tab=products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Novo Produto</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Informações Básicas */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Produto</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Terço Azul"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: TERC-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="tercos">Terços</option>
                  <option value="acessorios">Acessórios</option>
                  <option value="colares">Colares</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Imagem Principal</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/images/produto.jpg"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição detalhada do produto"
              />
            </div>
          </div>

          {/* Preços e Estoque */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Preços e Estoque</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Preço de Venda (R$)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Custo (R$)</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estoque</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Variações */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Variações (Opcional)</h2>

            {variations.length > 0 && (
              <div className="mb-4 bg-gray-50 rounded p-4">
                {variations.map((variation) => (
                  <div key={variation.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium">
                        {variation.type}: {variation.value}
                      </p>
                      <p className="text-sm text-gray-600">
                        R$ {variation.price.toFixed(2)} | Estoque: {variation.stock}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(variation.id)}
                      className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  value={newVariation.type}
                  onChange={(e) => setNewVariation({ ...newVariation, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="Cor">Cor</option>
                  <option value="Tamanho">Tamanho</option>
                  <option value="Material">Material</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor</label>
                <input
                  type="text"
                  value={newVariation.value}
                  onChange={(e) => setNewVariation({ ...newVariation, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Azul"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preço (+R$)</label>
                <input
                  type="number"
                  value={newVariation.price}
                  onChange={(e) => setNewVariation({ ...newVariation, price: Number.parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <Link href="/admin/dashboard?tab=products">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition font-medium"
            >
              Criar Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
