import { ScrollSection } from "@/components/scroll-section"

interface GridItemProps {
  title: string
  subtitle: string
  bgColor: string
  textColor: string
  imageUrl: string
  size?: "full" | "half"
}

function GridItem({ title, subtitle, bgColor, textColor, imageUrl, size = "half" }: GridItemProps) {
  return (
    <ScrollSection
      className={`relative ${
        size === "full" ? "col-span-1 md:col-span-2" : "col-span-1"
      } min-h-[600px] flex items-end justify-center ${bgColor} ${textColor} overflow-hidden`}
    >
      <img
        src={imageUrl || "/placeholder.svg"}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="relative z-10 text-center px-6 pb-12 max-w-xl">
        <h3 className="text-3xl md:text-5xl font-semibold mb-2 tracking-tight">{title}</h3>
        <p className="text-lg md:text-xl mb-6 opacity-80 font-normal">{subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#saiba-mais" className="text-[#2997ff] hover:underline text-lg">
            Saiba mais
          </a>
          <a href="#comprar" className="text-[#2997ff] hover:underline text-lg">
            Comprar
          </a>
        </div>
      </div>
    </ScrollSection>
  )
}

export function AppleGridSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GridItem
          title="Terço Artesanal"
          subtitle="Feito à mão. Peça única."
          bgColor="bg-[#f5f5f7]"
          textColor="text-black"
          imageUrl="/handmade-wooden-rosary-beads-close-up.jpg"
        />
        <GridItem
          title="Terço de Prata"
          subtitle="Elegância atemporal."
          bgColor="bg-[#fbfbfd]"
          textColor="text-black"
          imageUrl="/silver-rosary-beads-luxury.jpg"
        />
        <GridItem
          title="Terço de Pedras"
          subtitle="Natureza e espiritualidade."
          bgColor="bg-[#fbfbfd]"
          textColor="text-black"
          imageUrl="/natural-stone-rosary-beads.jpg"
        />
        <GridItem
          title="Terço Infantil"
          subtitle="Para os pequenos fiéis."
          bgColor="bg-[#f5f5f7]"
          textColor="text-black"
          imageUrl="/colorful-childrens-rosary-beads.jpg"
        />
      </div>
    </section>
  )
}
