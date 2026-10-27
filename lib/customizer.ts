import type { Product } from "./products"
import { storeConfig } from "./store-config"

/*
 * Terço personalizado: opções e preço.
 * Usado na tela /personalizar, na sacola e no servidor (que recalcula o preço — nunca confia no navegador).
 */

export const CUSTOM_SLUG = "terco-personalizado"

/** Acréscimo por gravar um nome/palavra nas contas de letras */
export const NAME_PRICE = 5
export const NAME_MAX = 10
/** Limite da intenção de oração escrita no cartão */
export const INTENTION_MAX = 80

export const beadColors = [
  { id: "azul", label: "Azul", hex: "#2547a6", shine: "#7d9bf0" },
  { id: "preto", label: "Preto fosco", hex: "#1b1b1d", shine: "#5a5a60" },
  { id: "rosa", label: "Rosa", hex: "#e2689a", shine: "#f8b4cf" },
  { id: "perola", label: "Pérola", hex: "#ece6da", shine: "#ffffff" },
  { id: "madeira", label: "Madeira", hex: "#8a5a35", shine: "#c48f62" },
  { id: "vermelho", label: "Vermelho", hex: "#a3202c", shine: "#e46a74" },
] as const

export const crucifixes = [
  { id: "metal-classico", label: "Metálico clássico", detail: "Prata envelhecida, traço reto" },
  { id: "metal-ornamentado", label: "Metálico ornamentado", detail: "Pontas trabalhadas com Cristo em relevo" },
  { id: "madeira", label: "Madeira", detail: "Cruz de madeira com Cristo em metal" },
] as const

export const medals = [
  { id: "aparecida", label: "Nossa Senhora Aparecida" },
  { id: "gracas", label: "Nossa Senhora das Graças" },
  { id: "sagrado-coracao", label: "Sagrado Coração de Jesus" },
  { id: "sao-bento", label: "São Bento" },
  { id: "espirito-santo", label: "Divino Espírito Santo" },
] as const

/** Como as contas são unidas; "corrente" é o padrão (pedidos antigos não tinham esta escolha) */
export const cords = [
  { id: "corrente", label: "Corrente prateada", detail: "Elos de metal entre as contas", hex: "#9a9aa1" },
  { id: "cru", label: "Cordão cru", detail: "Algodão em tom natural", hex: "#d9c9a8" },
  { id: "marrom", label: "Cordão marrom", detail: "Algodão em tom café", hex: "#6b4a2f" },
  { id: "preto", label: "Cordão preto", detail: "Algodão em tom preto", hex: "#262426" },
] as const

export type BeadColor = (typeof beadColors)[number]["id"]
export type Crucifix = (typeof crucifixes)[number]["id"]
export type Medal = (typeof medals)[number]["id"]
export type Cord = (typeof cords)[number]["id"]

export interface CustomRosary {
  color: BeadColor
  crucifix: Crucifix
  medal: Medal
  /** Letras gravadas (A–Z, sem acento); vazio = sem nome */
  name: string
  cord: Cord
  /** Intenção de oração escrita à mão no cartão que acompanha o terço; vazio = sem cartão */
  intention: string
  /** Caixa de presente (cortesia, sem custo) */
  giftBox: boolean
}

export const defaultCustom: CustomRosary = {
  color: "azul",
  crucifix: "metal-classico",
  medal: "aparecida",
  name: "",
  cord: "corrente",
  intention: "",
  giftBox: false,
}

/** Deixa só letras A–Z maiúsculas (contas de letras não têm acento) e corta no limite */
export function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, NAME_MAX)
}

/** Texto livre da intenção: sem caracteres de controle, espaços simples e no limite */
export function normalizeIntention(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, INTENTION_MAX)
}

/** Confere as opções (vindas do navegador ou do localStorage); devolve null se algo não existir */
export function parseCustom(input: unknown): CustomRosary | null {
  const c = input as Partial<Record<keyof CustomRosary, unknown>> | null
  if (!c || typeof c !== "object") return null
  const color = beadColors.find((o) => o.id === c.color)?.id
  const crucifix = crucifixes.find((o) => o.id === c.crucifix)?.id
  const medal = medals.find((o) => o.id === c.medal)?.id
  const name = typeof c.name === "string" ? normalizeName(c.name).trim() : ""
  // campos novos: ausentes em sacolas e pedidos antigos, então valem o padrão
  const cord = c.cord === undefined ? defaultCustom.cord : cords.find((o) => o.id === c.cord)?.id
  const intention = typeof c.intention === "string" ? normalizeIntention(c.intention).trim() : ""
  if (!color || !crucifix || !medal || !cord) return null
  if (typeof c.name === "string" && c.name.length > 40) return null
  if (typeof c.intention === "string" && c.intention.length > INTENTION_MAX * 3) return null
  if (c.giftBox !== undefined && typeof c.giftBox !== "boolean") return null
  return { color, crucifix, medal, name, cord, intention, giftBox: c.giftBox === true }
}

export function customPrice(c: CustomRosary) {
  return storeConfig.unitPrice + (c.name ? NAME_PRICE : 0)
}

/** "Contas azul • Nome "ANA" • Cruz metálico clássico • São Bento • Cordão cru • Intenção: "…" • Caixa de presente" */
export function describeCustom(c: CustomRosary) {
  const parts = [
    `Contas ${beadColors.find((o) => o.id === c.color)!.label.toLowerCase()}`,
    c.name ? `Nome "${c.name}"` : null,
    `Cruz ${crucifixes.find((o) => o.id === c.crucifix)!.label.toLowerCase()}`,
    medals.find((o) => o.id === c.medal)!.label,
    cords.find((o) => o.id === c.cord)!.label,
    c.intention ? `Intenção: "${c.intention}"` : null,
    c.giftBox ? "Caixa de presente" : null,
  ]
  return parts.filter(Boolean).join(" • ")
}

/** Identifica a mesma combinação na sacola (dois iguais somam quantidade) */
export function customKey(c: CustomRosary) {
  const gift = c.giftBox ? "caixa" : ""
  return [CUSTOM_SLUG, c.color, c.crucifix, c.medal, c.name, c.cord, gift, encodeURIComponent(c.intention)].join(":")
}

/** Produto "virtual" para a sacola e o resumo do pedido */
export function customProduct(c: CustomRosary): Product {
  return {
    slug: CUSTOM_SLUG,
    name: "Terço Personalizado",
    price: customPrice(c),
    color:
      c.color === "madeira" || c.color === "perola" || c.color === "azul" || c.color === "rosa" ? c.color : "preto",
    badge: "Personalizado",
    materials: describeCustom(c),
    description: "Terço montado à mão com as suas escolhas.",
    note: "",
    longDescription: "",
    images: ["/artisan-hands-crafting-rosary-beads-workshop.jpg"],
    specs: [],
    highlights: [],
    available: true,
  }
}
