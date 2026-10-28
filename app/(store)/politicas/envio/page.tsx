import type { Metadata } from "next"
import { ProsePage } from "@/components/site/prose-page"
import { storeConfig } from "@/lib/store-config"

export const metadata: Metadata = { title: "Políticas de Envio & Prazos" }

export default function EnvioPage() {
  const { shipping } = storeConfig
  return (
    <ProsePage eyebrow="Transparência" title="Políticas de Envio & Prazos" description="Como sua devoção chega até você.">
      <h2>Para onde enviamos</h2>
      <p>Enviamos para todo o Brasil, com código de rastreio enviado por e-mail e WhatsApp.</p>
      <h2>Valores de frete</h2>
      <p>
        Enviamos pelos <strong>Correios</strong>, com <strong>PAC</strong> ou <strong>SEDEX</strong>, à sua escolha. O valor
        é calculado pelo seu CEP e pela quantidade de terços, e aparece no checkout antes do pagamento.
      </p>
      <h2>Prazos</h2>
      <p>
        O prazo mostrado no checkout já inclui {shipping.handlingDays} dias úteis para montarmos o seu terço, mais o prazo
        dos Correios. Como cada peça é feita à mão, em datas comemorativas o prazo pode se estender um pouco — avisaremos
        você caso isso aconteça.
      </p>
      <h2>Embalagem</h2>
      <p>Cada terço vai em saquinho de tecido, protegido para a viagem e pronto para presentear.</p>
    </ProsePage>
  )
}
