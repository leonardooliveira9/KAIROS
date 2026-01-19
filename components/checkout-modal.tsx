"use client"

import type React from "react"

import { useState } from "react"
import { Check } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const ABACATEPAY_LINKS_BY_NAME: Array<{ match: RegExp; url: string }> = [
  {
    match: /ter[cç]o\s+azul/i,
    url: "https://app.abacatepay.com/pay/bill_ScKT0HR6w01j4N0Rer3mPRpu",
  },
  {
    match: /ter[cç]o\s+preto/i,
    url: "https://app.abacatepay.com/pay/bill_JwSdpuKxCbGqgaYqThaqcHhY",
  },
  {
    match: /ter[cç]o\s+rosa/i,
    url: "https://app.abacatepay.com/pay/bill_MGxnbHmnTrsRs6jEzJx0Ag1w",
  },
]

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
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
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
  }

  const getAbacatePayUrlIfSingleProduct = () => {
    // ✅ segurança: como o link é fixo por produto, só redireciona se tiver 1 tipo de produto
    if (items.length !== 1) return null

    const itemName = (items[0].name || "").trim()
    if (!itemName) return null

    const found = ABACATEPAY_LINKS_BY_NAME.find((x) => x.match.test(itemName))
    return found?.url ?? null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (items.length === 0) {
      setErrorMsg("Seu carrinho está vazio.")
      return
    }

    setIsLoading(true)

    try {
      // 1) cria o pedido no backend (pra você ter registro do cliente/pedido)
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
          total: totalPrice,
          qrCode: "", // seu orders/route.ts usa body.qrCode; mandamos vazio para não quebrar
        }),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok || !orderData?.success) {
        throw new Error(orderData?.error || "Não foi possível criar o pedido.")
      }

      // 2) se for um dos terços com link pronto e estiver sozinho no carrinho → redireciona
      const abacateUrl = getAbacatePayUrlIfSingleProduct()
      if (abacateUrl) {
        setIsCheckoutOpen(false)
        clearCart()
        resetForm()

        window.location.href = abacateUrl
        return
      }

      // 3) fallback: se não for um produto com link pronto, mantém comportamento atual
      setIsSubmitted(true)
      setTimeout(() => {
        clearCart()
        setIsSubmitted(false)
        setIsCheckoutOpen(false)
        resetForm()
      }, 3000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao confirmar pedido.")
    } finally {
      setIsLoading(false)
    }
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

            {items.length !== 1 && (
              <div className="rounded-lg border border-amber-300/40 bg-amber-100/40 p-3 text-sm text-amber-900">
                Pagamento via AbacatePay (link pronto) está disponível apenas quando o carrinho tem{" "}
                <strong>um único terço</strong> (azul, preto ou rosa). Para múltiplos itens, você precisa do checkout PIX
                dinâmico via API.
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

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
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processando..." : "Confirmar Pedido"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
