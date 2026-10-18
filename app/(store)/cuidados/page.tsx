import type { Metadata } from "next"
import { ProsePage } from "@/components/site/prose-page"

export const metadata: Metadata = { title: "Cuidados com seu Terço" }

export default function CuidadosPage() {
  return (
    <ProsePage eyebrow="Transparência" title="Cuidados com seu Terço" description="Pequenos gestos para que ele acompanhe você por muitos anos.">
      <h2>No dia a dia</h2>
      <ul>
        <li>Evite molhar o terço ou usá-lo durante o banho.</li>
        <li>Mantenha longe de perfumes, cremes e produtos de limpeza.</li>
        <li>Não puxe o cordão com força: deslize as contas com suavidade.</li>
      </ul>
      <h2>Limpeza</h2>
      <p>Passe um pano de algodão macio e seco. Em peças de madeira, um pouco de cera de abelha renova o brilho.</p>
      <h2>Como guardar</h2>
      <p>Guarde em local seco e arejado, de preferência no saquinho de tecido que acompanha a peça.</p>
      <h2>Bênção</h2>
      <p>Recomendamos levar seu terço para ser abençoado por um sacerdote antes de começar a usá-lo.</p>
    </ProsePage>
  )
}
