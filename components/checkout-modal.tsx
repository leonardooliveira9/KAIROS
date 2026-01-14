"use client"

import type React from "react"

import { useState } from "react"
import { Check } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CheckoutModal() {
  const { items, totalPrice, isCheckoutOpen, setIsCheckoutOpen, clearCart } = useCart()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    observations: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the order to a backend
    setIsSubmitted(true)
    setTimeout(() => {
      clearCart()
      setIsSubmitted(false)
      setIsCheckoutOpen(false)
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        cpf: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        observations: "",
      })
    }, 3000)
  }

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Pedido</DialogTitle>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Pedido Enviado!</h3>
            <p className="text-muted-foreground">Entraremos em contato em breve para confirmar seu pedido.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-secondary p-4 rounded-lg">
              <h4 className="font-medium text-secondary-foreground mb-2">Resumo do Pedido</h4>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2 font-bold flex justify-between">
                  <span>Total:</span>
                  <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Dados Pessoais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    required
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Endereço de Entrega</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Rua, número, complemento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Sua cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="UF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP *</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                placeholder="Alguma observação sobre o pedido?"
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              Confirmar Pedido
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
