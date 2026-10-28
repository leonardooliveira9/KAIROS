import { z } from "zod"
import { onlyDigits } from "./format"
import { SHIPPING_SERVICES } from "./shipping"

export function isValidCPF(value: string) {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digit = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const

export const customerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(5, "Informe seu nome completo")
    .max(120)
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 10 || v.length === 11, "WhatsApp com DDD, ex.: (61) 99999-9999"),
  cpf: z.string().transform(onlyDigits).refine(isValidCPF, "CPF inválido"),
})

export const addressSchema = z.object({
  cep: z.string().transform(onlyDigits).refine((v) => v.length === 8, "CEP inválido"),
  street: z.string().trim().min(3, "Informe a rua").max(160),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(80).optional().default(""),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(80),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z.enum(UFS, { errorMap: () => ({ message: "UF inválida" }) }),
  notes: z.string().trim().max(500).optional().default(""),
})

export const checkoutSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(80),
        quantity: z.number().int().min(1).max(20),
        // escolhas do terço personalizado; conferidas por parseCustom no servidor
        custom: z.unknown().optional(),
      }),
    )
    .min(1, "Sua sacola está vazia")
    .max(20),
  /** Serviço escolhido; o preço é cotado de novo no servidor */
  shippingService: z.enum(SHIPPING_SERVICES, { errorMap: () => ({ message: "Escolha a forma de envio" }) }),
  /** Cupom digitado pelo cliente (opcional); conferido de novo no servidor */
  couponCode: z.string().trim().max(30).optional().default(""),
})

export type CustomerInput = z.input<typeof customerSchema>
export type AddressInput = z.input<typeof addressSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>

/** Converte erros do zod em { campo: mensagem } para exibir no formulário */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[issue.path.length - 1] ?? "form")
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres")
  .max(128, "Senha muito longa")

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  password: z.string().min(1, "Informe a senha").max(128),
})

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v === "" || isValidCPF(v), "CPF inválido"),
  phone: z
    .string()
    .optional()
    .default("")
    .transform(onlyDigits)
    .refine((v) => v === "" || v.length === 10 || v.length === 11, "WhatsApp com DDD, ex.: (61) 99999-9999"),
})

export const changePasswordSchema = z.object({
  // vazio só é aceito em contas criadas pelo Google que ainda não têm senha
  currentPassword: z.string().max(128).optional().default(""),
  newPassword: passwordSchema,
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: passwordSchema,
})

/** Endereço de imagem aceito no produto: arquivo do site (/…) ou https */
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^\/[^/]/.test(v) || /^https:\/\/[^\s]+$/.test(v), "Imagem inválida")

/** Cadastro de produto pelo admin */
export const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "Informe o endereço")
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífen (ex.: terco-azul)"),
  name: z.string().trim().min(3, "Informe o nome").max(80),
  price: z.coerce.number().min(1, "Preço mínimo de R$ 1,00").max(10000).transform((v) => Math.round(v * 100) / 100),
  color: z.enum(["azul", "preto", "rosa", "madeira", "perola"], { errorMap: () => ({ message: "Escolha a cor" }) }),
  badge: z.string().trim().max(30).default(""),
  materials: z.string().trim().min(3, "Informe os materiais").max(80),
  description: z.string().trim().min(10, "Escreva uma descrição curta").max(240),
  note: z.string().trim().max(160).default(""),
  longDescription: z.string().trim().max(2000).default(""),
  images: z.array(imageUrl).min(1, "Adicione pelo menos uma foto").max(8, "No máximo 8 fotos"),
  specs: z
    .array(z.object({ label: z.string().trim().min(1).max(40), value: z.string().trim().min(1).max(120) }))
    .max(10)
    .default([]),
  highlights: z
    .array(z.object({ title: z.string().trim().min(1).max(40), text: z.string().trim().min(1).max(200) }))
    .max(6)
    .default([]),
  available: z.boolean().default(true),
})

/** Cupom criado no admin */
export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,20}$/, "De 3 a 20 letras, números, - ou _ (sem espaço)"),
    kind: z.enum(["percent", "fixed", "shipping"], { errorMap: () => ({ message: "Escolha o tipo" }) }),
    value: z.coerce.number().min(0).max(10000).default(0),
    minSubtotal: z.coerce.number().min(0).max(100000).default(0),
    expiresOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
      .nullable()
      .or(z.literal("").transform(() => null))
      .default(null),
    maxUses: z.coerce.number().int().min(1, "Mínimo de 1 uso").nullable().default(null),
    active: z.boolean().default(true),
  })
  .superRefine((c, ctx) => {
    if (c.kind === "percent" && (c.value < 1 || c.value > 100)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Use de 1% a 100%" })
    }
    if (c.kind === "fixed" && c.value < 1) ctx.addIssue({ code: "custom", path: ["value"], message: "Mínimo de R$ 1,00" })
  })
