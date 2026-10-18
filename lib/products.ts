import { storeConfig } from "./store-config"

export type ProductColor = "azul" | "preto" | "rosa" | "madeira" | "perola"

export interface Product {
  slug: string
  name: string
  price: number
  color: ProductColor
  /** Selo no canto da foto ("Mais Procurado") */
  badge: string
  /** Linha curta de materiais exibida na sacola ("Fio náutico • Feito à mão") */
  materials: string
  description: string
  /** Frase em itálico no card */
  note: string
  longDescription: string
  images: string[]
  specs: { label: string; value: string }[]
  highlights: { title: string; text: string }[]
  /** false esconde o produto da loja sem apagá-lo */
  available: boolean
}

export const colorFilters: { id: ProductColor | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "azul", label: "Azul" },
  { id: "preto", label: "Preto" },
  { id: "rosa", label: "Rosa" },
  { id: "madeira", label: "Madeira Nobre" },
  { id: "perola", label: "Pérola" },
]

const price = storeConfig.unitPrice

const allProducts: Product[] = [
  {
    slug: "terco-azul-sereno",
    name: "Terço Azul Sereno",
    price,
    color: "azul",
    badge: "Azul Celeste",
    materials: "Fio náutico resistente • Feito à mão",
    description: "Contas azuis polidas com fio encerado de alta tenacidade e medalha de Nossa Senhora.",
    note: "Perfeito para momentos de paz e contemplação mariana.",
    longDescription:
      "Confeccionado artesanalmente com contas azuis translúcidas e entremeios brancos em fio náutico encerado. A medalha de Nossa Senhora das Graças e o crucifixo clássico em metal envelhecido acompanham cada mistério com delicadeza.",
    images: ["/Terço-azul.jpg", "/Terços.jpg", "/blue-rosary-beads-elegant-on-white-background.jpg", "/artisan-hands-crafting-rosary-beads-workshop.jpg"],
    specs: [
      { label: "Contas principais", value: "Acrílico perolado azul 8mm" },
      { label: "Cordão", value: "Fio náutico encerado reforçado" },
      { label: "Entremeio", value: "Medalha de Nossa Senhora das Graças" },
      { label: "Comprimento total", value: "Aproximadamente 45 cm" },
    ],
    highlights: [
      { title: "Cor do céu", text: "O azul celeste evoca o manto de Maria e convida à serenidade em cada dezena." },
      { title: "Nós firmes", text: "Cada conta é separada por nós feitos à mão, para um deslizar suave e seguro." },
      { title: "Medalha mariana", text: "A imagem de Nossa Senhora no centro marca o início da oração." },
    ],
    available: true,
  },
  {
    slug: "terco-preto-jesus",
    name: "Terço Preto JESUS",
    price,
    color: "preto",
    badge: "Mais Procurado",
    materials: "Madeira nobre escura • Cruz metálica",
    description: "Contas foscas pretas de textura aveludada, entremeio com relevo gravado JESUS e crucifixo.",
    note: "Força, sobriedade e presença espiritual para o dia a dia.",
    longDescription:
      "Confeccionado artesanalmente com contas foscas de 8mm e cordão de alta durabilidade. O entremeio gravado \"JESUS\" e a cruz minimalista proporcionam firmeza suave e toque aveludado no manuseio diário da oração.",
    images: ["/Terço-preto.jpg", "/black-rosary-beads-with-jesus-cross-elegant.jpg", "/elegant-wooden-rosary-beads-on-dark-minimalist-bac.jpg", "/artisan-hands-crafting-rosary-beads-workshop.jpg"],
    specs: [
      { label: "Contas principais", value: "Contas foscas pretas 8mm" },
      { label: "Cordão", value: "Fio encerado antialérgico reforçado" },
      { label: "Entremeio", value: "Metal grafite com relevo \"JESUS\"" },
      { label: "Comprimento total", value: "Aproximadamente 42 cm" },
    ],
    highlights: [
      { title: "Matéria nobre", text: "Contas de toque macio e aveludado, que acolhem a mão durante a oração." },
      { title: "Nós contemplativos", text: "O espaçamento entre cada dezena foi calibrado para o deslizar natural dos dedos." },
      { title: "O Santo Nome", text: "A gravação \"JESUS\" no centro serve de âncora espiritual para o recolhimento." },
    ],
    available: true,
  },
  {
    slug: "terco-rosa-rebeca",
    name: "Terço Rosa REBECA",
    price,
    color: "rosa",
    badge: "Especial Presente",
    materials: "Contas peroladas rosé • Medalha fina",
    description: "Contas peroladas rosé de toque suave, entremeio de Santa Rebeca e filigranas douradas.",
    note: "Delicadeza, ternura e devoção para você ou para presentear.",
    longDescription:
      "Um terço delicado em tons de rosa, pensado para presentear com amor. As contas peroladas refletem a luz com suavidade, e os detalhes em metal dourado completam uma peça feminina e cheia de significado.",
    images: ["/Terço-rosa.jpg", "/pink-rose-rosary-beads-feminine-elegant.jpg", "/Terços.jpg", "/artisan-hands-crafting-rosary-beads-workshop.jpg"],
    specs: [
      { label: "Contas principais", value: "Peroladas rosé 8mm" },
      { label: "Cordão", value: "Fio encerado reforçado" },
      { label: "Entremeio", value: "Medalha com filigrana dourada" },
      { label: "Comprimento total", value: "Aproximadamente 42 cm" },
    ],
    highlights: [
      { title: "Tom de ternura", text: "O rosé suave traduz carinho — ideal para batizados, aniversários e Primeira Eucaristia." },
      { title: "Acabamento fino", text: "Filigranas douradas feitas para durar e manter o brilho com o uso." },
      { title: "Para presentear", text: "Enviado em saquinho de tecido, pronto para entregar a quem você ama." },
    ],
    available: true,
  },
  {
    // Modelo novo do mockup — confirme se já está em produção antes de publicar
    slug: "terco-madeira-nobre",
    name: "Terço de Madeira Nobre",
    price,
    color: "madeira",
    badge: "Rústico",
    materials: "Feito à mão • Cordão cru",
    description: "Contas de madeira natural encerada, cordão cru e crucifixo de madeira com Cristo em metal.",
    note: "A simplicidade da madeira para a oração de todos os dias.",
    longDescription:
      "Contas de madeira natural protegidas com ceras naturais, unidas por cordão cru trançado à mão. Uma peça rústica, quente ao toque, que acompanha a oração com simplicidade.",
    images: ["/handmade-wooden-rosary-beads-close-up.jpg", "/wooden-rosary-beads-elegant-lighting.jpg", "/elegant-wooden-rosary-beads-on-dark-minimalist-bac.jpg", "/artisan-hands-crafting-rosary-beads-workshop.jpg"],
    specs: [
      { label: "Contas principais", value: "Madeira natural encerada 8mm" },
      { label: "Cordão", value: "Algodão cru trançado" },
      { label: "Crucifixo", value: "Madeira com Cristo em metal" },
      { label: "Comprimento total", value: "Aproximadamente 44 cm" },
    ],
    highlights: [
      { title: "Madeira viva", text: "Cada conta tem veios únicos — não existem dois terços iguais." },
      { title: "Calor ao toque", text: "A madeira absorve a temperatura do corpo, tornando a oração mais acolhedora." },
      { title: "Feito para durar", text: "Ceras naturais protegem as contas do desgaste do uso diário." },
    ],
    available: true,
  },
  {
    // Modelo novo do mockup — confirme se já está em produção antes de publicar
    slug: "terco-perola-suave",
    name: "Terço Pérola Suave",
    price,
    color: "perola",
    badge: "Delicado",
    materials: "Feito à mão • Medalha prata",
    description: "Contas peroladas brancas com reflexo acetinado, medalha prateada e crucifixo trabalhado.",
    note: "Pureza e leveza para celebrar os sacramentos.",
    longDescription:
      "Contas peroladas de reflexo acetinado e detalhes prateados compõem uma peça clara e luminosa, muito escolhida para Primeira Eucaristia, Crisma e casamentos.",
    images: ["/gold-pearl-rosary-beads-luxury-white-background.jpg", "/elegant-rosary-beads-on-minimalist-white-surface.jpg", "/crystal-rosary-beads-luxury-minimal.jpg", "/artisan-hands-crafting-rosary-beads-workshop.jpg"],
    specs: [
      { label: "Contas principais", value: "Peroladas brancas 7mm" },
      { label: "Cordão", value: "Fio encerado reforçado" },
      { label: "Entremeio", value: "Medalha prateada" },
      { label: "Comprimento total", value: "Aproximadamente 40 cm" },
    ],
    highlights: [
      { title: "Luz suave", text: "O brilho acetinado das pérolas lembra a pureza da vida sacramental." },
      { title: "Leve na mão", text: "Contas de 7mm, confortáveis para orar em qualquer lugar." },
      { title: "Para celebrar", text: "Presente clássico para Eucaristia, Crisma e casamento." },
    ],
    available: true,
  },
]

export const products = allProducts.filter((p) => p.available)

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug)
}
