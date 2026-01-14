import { ScrollSection } from "@/components/scroll-section"

interface AppleProductSectionProps {
  title: string
  subtitle: string
  bgColor: string
  textColor: string
  imageUrl: string
  id?: string
}

export function AppleProductSection({ title, subtitle, bgColor, textColor, imageUrl, id }: AppleProductSectionProps) {
  return (
    <ScrollSection
      className={`relative min-h-screen flex items-center justify-center ${bgColor} ${textColor} overflow-hidden`}
    >
      <section id={id} className="absolute inset-0" />
      <img
        src={imageUrl || "/placeholder.svg"}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="relative z-10 text-center px-6 max-w-4xl">
        <h2 className="text-5xl md:text-7xl font-semibold mb-4 tracking-tight">{title}</h2>
        <p className="text-xl md:text-2xl mb-8 opacity-80 font-normal">{subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#saiba-mais" className="text-[#2997ff] hover:underline text-xl">
            Saiba mais
          </a>
          <a href="#comprar" className="text-[#2997ff] hover:underline text-xl">
            Comprar
          </a>
        </div>
      </div>
    </ScrollSection>
  )
}
