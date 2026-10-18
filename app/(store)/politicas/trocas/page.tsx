import type { Metadata } from "next"
import { ProsePage } from "@/components/site/prose-page"
import { storeConfig, whatsappLink } from "@/lib/store-config"

export const metadata: Metadata = { title: "Trocas e Devoluções" }

export default function TrocasPage() {
  return (
    <ProsePage eyebrow="Transparência" title="Trocas e Devoluções" description="Queremos que você ame sua peça.">
      <h2>Direito de arrependimento</h2>
      <p>
        Você pode desistir da compra em até <strong>7 dias corridos após o recebimento</strong>, conforme o Código de
        Defesa do Consumidor. Devolvemos o valor integral via PIX assim que recebermos a peça.
      </p>
      <h2>Defeito de fabricação</h2>
      <p>
        Se o terço chegar com qualquer defeito, trocamos sem custo para você. Basta nos enviar uma foto em até 30 dias.
      </p>
      <h2>Como solicitar</h2>
      <ul>
        <li>
          Pelo{" "}
          <a href={whatsappLink("Olá! Gostaria de solicitar uma troca.")} className="underline underline-offset-4" target="_blank" rel="noreferrer">
            WhatsApp {storeConfig.contact.whatsappLabel}
          </a>
          , informando o número do pedido.
        </li>
        <li>
          Ou pelo e-mail{" "}
          <a href={`mailto:${storeConfig.contact.email}`} className="underline underline-offset-4">
            {storeConfig.contact.email}
          </a>
          .
        </li>
      </ul>
    </ProsePage>
  )
}
