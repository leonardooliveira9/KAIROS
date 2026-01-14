"use client"

import { Plus, Minus, Trash2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, setIsCheckoutOpen } = useCart()

  const handleCheckout = () => {
    setIsCartOpen(false)
    setIsCheckoutOpen(true)
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Carrinho de Compras</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto py-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-secondary rounded-lg">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">R$ {item.price.toFixed(2).replace(".", ",")}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-background transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-background transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto p-1 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-xl font-bold">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  Finalizar Pedido
                </button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
