// Tipos do frete compartilhados entre o navegador e o servidor

export const SHIPPING_SERVICES = ["pac", "sedex"] as const
export type ShippingService = (typeof SHIPPING_SERVICES)[number]

/** Uma opção de entrega cotada para o CEP do cliente */
export interface ShippingQuote {
  service: ShippingService
  /** Ex.: "PAC", "SEDEX" */
  name: string
  price: number
  /** Dias úteis até a entrega, já somado o tempo de preparo do terço */
  days: number
}

/** "até 8 dias úteis" */
export const deliveryLabel = (days: number) => `até ${days} ${days === 1 ? "dia útil" : "dias úteis"}`
