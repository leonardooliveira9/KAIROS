import { Truck, Shield, Award, Heart } from "lucide-react"

const features = [
  {
    icon: Truck,
    title: "Entrega Segura",
    description: "Enviamos para todo o Brasil com embalagem especial.",
  },
  {
    icon: Shield,
    title: "Garantia de Qualidade",
    description: "Todos os produtos passam por rigoroso controle de qualidade.",
  },
  {
    icon: Award,
    title: "Feito à Mão",
    description: "Peças artesanais únicas criadas por mestres artesãos.",
  },
  {
    icon: Heart,
    title: "Tradição e Fé",
    description: "Mais de 1 ano dedicados à arte sacra.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-background text-foreground mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-secondary-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
