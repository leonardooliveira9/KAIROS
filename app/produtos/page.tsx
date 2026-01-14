import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { CartDrawer } from "@/components/cart-drawer"
import { CheckoutModal } from "@/components/checkout-modal"
import { products } from "@/lib/products"

export default function ProdutosPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Header */}
        <section className="bg-secondary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Nossos Produtos</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Escolha o terço perfeito para você ou para presentear alguém especial.
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <span className="inline-block bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium">
                Todos por R$ 25,00
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-secondary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Feito à Mão</h3>
                <p className="text-sm text-muted-foreground">Cada peça é única e confeccionada com carinho.</p>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Entrega Rápida</h3>
                <p className="text-sm text-muted-foreground">Enviamos seu pedido em até 3 dias úteis.</p>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Com Amor</h3>
                <p className="text-sm text-muted-foreground">Produzido com fé e dedicação.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <CartDrawer />
      <CheckoutModal />
    </>
  )
}
