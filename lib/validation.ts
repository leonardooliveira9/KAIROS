import { z } from "zod"
import { onlyDigits } from "./format"

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
    .array(z.object({ slug: z.string().min(1).max(80), quantity: z.number().int().min(1).max(20) }))
    .min(1, "Sua sacola está vazia")
    .max(20),
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
