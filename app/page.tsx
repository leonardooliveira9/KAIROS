import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { CartDrawer } from "@/components/cart-drawer"
import { CheckoutModal } from "@/components/checkout-modal"
import { products } from "@/lib/products"

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <section className="relative bg-secondary py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                  Terços Artesanais com Amor e Fé
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-lg">
                  Cada peça é única, feita à mão com dedicação. Encontre o terço perfeito para sua jornada espiritual.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/produtos"
                    className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-medium hover:bg-foreground/90 transition-colors"
                  >
                    Ver Produtos
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/sobre"
                    className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-full font-medium hover:bg-background transition-colors"
                  >
                    Nossa História
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <img
                    src="/blue-rosary-beads-elegant-on-white-background.jpg"
                    alt="Terço Azul"
                    className="rounded-2xl shadow-lg w-full aspect-square object-cover"
                  />
                  <img
                    src="/pink-rose-rosary-beads-feminine-elegant.jpg"
                    alt="Terço Rosa"
                    className="rounded-2xl shadow-lg w-full aspect-square object-cover mt-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Nossos Terços</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Peças únicas feitas com materiais de qualidade e muito carinho.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 text-foreground font-medium hover:underline"
              >
                Ver todos os produtos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Banner Section */}
        <section className="bg-foreground text-background py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">Todos os terços por apenas R$ 25,00</h2>
            <p className="text-background/70 max-w-2xl mx-auto mb-8">
              Preço único e acessível para que todos possam ter um terço especial.
            </p>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-3 rounded-full font-medium hover:bg-background/90 transition-colors"
            >
              Comprar Agora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* About Preview */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src="/black-rosary-beads-with-jesus-cross-elegant.jpg"
                  alt="Terço artesanal"
                  className="rounded-2xl shadow-lg w-full max-w-md mx-auto"
                />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Sobre a Kairos</h2>
                <p className="text-muted-foreground mb-4">
                  A Kairos nasceu do amor pela fé e pelo artesanato. Cada terço é confeccionado com cuidado, pensando em
                  proporcionar momentos de paz e conexão espiritual.
                </p>
                <p className="text-muted-foreground mb-6">
                  Nosso nome vem do grego "Kairos", que significa "o momento certo" - o momento perfeito para a oração e
                  reflexão.
                </p>
                <Link
                  href="/sobre"
                  className="inline-flex items-center gap-2 text-foreground font-medium hover:underline"
                >
                  Conheça nossa história
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
