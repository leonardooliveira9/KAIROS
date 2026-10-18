import type { Metadata } from "next"
import { ProsePage } from "@/components/site/prose-page"
import { formatBRL } from "@/lib/format"
import { storeConfig } from "@/lib/store-config"

export const metadata: Metadata = { title: "Políticas de Envio & Prazos" }

export default function EnvioPage() {
  const { shipping } = storeConfig
  return (
    <ProsePage eyebrow="Transparência" title="Políticas de Envio & Prazos" description="Como sua devoção chega até você.">
      <h2>Para onde enviamos</h2>
      <p>Enviamos para todo o Brasil, com código de rastreio enviado por e-mail e WhatsApp.</p>
      <h2>Valores de frete</h2>
      <ul>
        <li>
          Frete fixo de <strong>{formatBRL(shipping.flatFee)}</strong> para qualquer região.
        </li>
        <li>
          <strong>Frete grátis</strong> em compras a partir de {shipping.freeFromQuantity} terços.
        </li>
      </ul>
      <h2>Prazos</h2>
      <p>
        A entrega leva <strong>{shipping.estimate}</strong>. Como cada peça é feita à mão, em datas comemorativas o prazo
        pode se estender um pouco — avisaremos você caso isso aconteça.
      </p>
      <h2>Embalagem</h2>
      <p>Cada terço vai em saquinho de tecido, protegido para a viagem e pronto para presentear.</p>
    </ProsePage>
  )
}
