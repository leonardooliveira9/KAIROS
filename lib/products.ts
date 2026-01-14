export interface Product {
  id: string
  name: string
  price: number
  image: string
  description: string
  color: string
}

export const products: Product[] = [
  {
    id: "azul",
    name: "Terço Azul",
    price: 25,
    image: "/Terço-azul.jpg",
    description: "Terço artesanal com contas azuis, perfeito para momentos de oração e meditação.",
    color: "Azul",
  },
  {
    id: "preto-jesus",
    name: "Terço Preto JESUS",
    price: 25,
    image: "/black-rosary-beads-with-jesus-cross-elegant.jpg",
    description: "Terço preto com crucifixo especial de Jesus, símbolo de fé e devoção.",
    color: "Preto",
  },
  {
    id: "rosa-rebeca",
    name: "Terço Rosa REBECA",
    price: 25,
    image: "/pink-rose-rosary-beads-feminine-elegant.jpg",
    description: "Terço rosa delicado, ideal para presentear com amor e carinho.",
    color: "Rosa",
  },
]
