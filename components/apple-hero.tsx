"use client"

import { ScrollSection } from "@/components/scroll-section"

export function AppleHero() {
  return (
    <ScrollSection className="relative min-h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      <img
        src="/elegant-wooden-rosary-beads-on-dark-minimalist-bac.jpg"
        alt="Terço Premium"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="relative z-10 text-center px-6 max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-semibold mb-4 tracking-tight">Terço Clássico</h1>
        <p className="text-xl md:text-2xl mb-8 text-white/80 font-normal">Oração. Reflexão. Paz interior.</p>
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
