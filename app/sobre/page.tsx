import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawer } from "@/components/cart-drawer"
import { CheckoutModal } from "@/components/checkout-modal"

export default function SobrePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Header */}
        <section className="bg-secondary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Sobre a Kairos</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Conheça nossa história e o significado por trás de cada peça.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">Nossa História</h2>
                <p className="text-muted-foreground mb-4">
                  A Kairos nasceu de um sonho simples: levar fé e esperança através de terços artesanais feitos com
                  amor. Cada peça carrega consigo uma história, um propósito e uma bênção.
                </p>
                <p className="text-muted-foreground mb-4">
                  O nome "Kairos" vem do grego antigo e significa "o momento certo" ou "o momento oportuno". Na teologia
                  cristã, representa o tempo de Deus, diferente do tempo cronológico humano.
                </p>
                <p className="text-muted-foreground">
                  Acreditamos que cada terço encontra seu dono no momento certo, no tempo de Deus. Por isso, colocamos
                  dedicação em cada conta, em cada nó, em cada detalhe.
                </p>
              </div>
              <div className="relative">
                <img
                  src="/Terços.jpg"
                  alt="Terço artesanal Kairos"
                  className="rounded-2xl shadow-lg w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-secondary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Nossos Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-8 rounded-2xl">
                <h3 className="text-xl font-semibold text-foreground mb-4">Fé</h3>
                <p className="text-muted-foreground">
                  Cada terço é confeccionado com oração, para que carregue consigo a força da fé.
                </p>
              </div>
              <div className="bg-background p-8 rounded-2xl">
                <h3 className="text-xl font-semibold text-foreground mb-4">Qualidade</h3>
                <p className="text-muted-foreground">
                  Utilizamos materiais selecionados para garantir durabilidade e beleza em cada peça.
                </p>
              </div>
              <div className="bg-background p-8 rounded-2xl">
                <h3 className="text-xl font-semibold text-foreground mb-4">Acessibilidade</h3>
                <p className="text-muted-foreground">
                  Preço único de R$ 25,00 para que todos possam ter acesso a um terço especial.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Nossas Peças</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <img
                src="/Terço-azul.jpg"
                alt="Terço Azul"
                className="rounded-2xl w-full aspect-square object-cover"
              />
              <img
                src="/Terço-preto.jpg"
                alt="Terço Preto JESUS"
                className="rounded-2xl w-full aspect-square object-cover"
              />
              <img
                src="/Terço-rosa.jpg"
                alt="Terço Rosa REBECA"
                className="rounded-2xl w-full aspect-square object-cover"
              />
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
