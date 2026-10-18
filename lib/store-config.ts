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
    /** Frete fixo para todo o Brasil */
    flatFee: 9.9,
    /** A partir desta quantidade de terços, o frete é grátis */
    freeFromQuantity: 3,
    estimate: "3 a 8 dias úteis após a confirmação do PIX",
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

export function shippingFor(quantity: number) {
  if (quantity <= 0) return 0
  return quantity >= storeConfig.shipping.freeFromQuantity ? 0 : storeConfig.shipping.flatFee
}

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${storeConfig.contact.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
