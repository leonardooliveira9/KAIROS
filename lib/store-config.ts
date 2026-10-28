// Dados da loja usados no site, no checkout e no PIX.
// Ajuste aqui antes de publicar — nada disso é segredo.
export const storeConfig = {
  name: "Kairos",
  tagline: "Terços Artesanais",
  /** Nome exibido como "Beneficiário" na etapa do PIX */
  beneficiary: "Kairos Terços Artesanais",
  unitPrice: 25,
  contact: {
    whatsapp: "556193930139",
    whatsappLabel: "(61) 9393-0139",
    instagram: "kairoscatolico",
    email: "contato@kairos.com.br",
  },
  shipping: {
    /** CEP de onde os pacotes são postados (origem do cálculo dos Correios). Só números. */
    originCep: "71691153", // Av. Comercial, 1161 - São Sebastião, Brasília - DF
    /** Dias para montar o terço antes de postar; somados ao prazo dos Correios */
    handlingDays: 2,
    /**
     * Pacote enviado aos Correios (em cm e kg). O peso cresce com a quantidade;
     * a altura também, até o máximo. Confira com a caixa que você usa.
     */
    package: { width: 12, length: 17, baseHeight: 4, heightPerItem: 1, maxHeight: 20, baseWeightKg: 0.1, weightPerItemKg: 0.08 },
    /** Usado só quando o Melhor Envio não está configurado (sem MELHOR_ENVIO_TOKEN ou sem originCep) */
    fallback: { price: 9.9, days: 10 },
  },
  pix: {
    /** Chave PIX usada no modo PIX estático (quando não há ABACATEPAY_API_KEY) */
    key: "bac475e5-88ef-4402-8e5b-dde1a7cc5474",
    /** Até 25 caracteres, sem acentos — aparece no app do banco */
    merchantName: "KAIROS TERCOS",
    /** Até 15 caracteres, sem acentos */
    merchantCity: "BRASILIA",
    expiresInSeconds: 60 * 60,
  },
} as const

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${storeConfig.contact.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
