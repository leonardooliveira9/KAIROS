import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireRole, sameOrigin } from "@/lib/server/auth"
import { DuplicateError } from "@/lib/server/db"
import {
  createProduct,
  deleteProduct,
  getStoredProduct,
  listProducts,
  moveProduct,
  updateProduct,
} from "@/lib/server/products-store"
import { fieldErrors, productSchema } from "@/lib/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function guard(request: NextRequest, write = true) {
  if (write && !sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = await requireRole(request, "admin")
  return auth instanceof NextResponse ? auth : null
}

const invalid = (error: z.ZodError) =>
  NextResponse.json({ error: "Confira os campos do produto.", fields: fieldErrors(error) }, { status: 400 })

// Todos os produtos, inclusive os escondidos da loja
export async function GET(request: NextRequest) {
  const denied = await guard(request, false)
  if (denied) return denied
  return NextResponse.json({ products: await listProducts({ includeHidden: true }) })
}

// Novo produto
export async function POST(request: NextRequest) {
  const denied = await guard(request)
  if (denied) return denied
  const parsed = productSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return invalid(parsed.error)
  try {
    return NextResponse.json({ product: await createProduct(parsed.data) }, { status: 201 })
  } catch (err) {
    if (err instanceof DuplicateError) {
      const message = "Já existe um produto com este endereço."
      return NextResponse.json({ error: message, fields: { slug: message } }, { status: 409 })
    }
    throw err
  }
}

const moveSchema = z.object({ slug: z.string().max(60), move: z.union([z.literal(-1), z.literal(1)]) })

// Edita um produto ({ slug, ...campos }) ou muda a ordem ({ slug, move: -1 | 1 })
export async function PATCH(request: NextRequest) {
  const denied = await guard(request)
  if (denied) return denied
  const body = await request.json().catch(() => null)

  const move = moveSchema.safeParse(body)
  if (move.success) {
    await moveProduct(move.data.slug, move.data.move)
    return NextResponse.json({ products: await listProducts({ includeHidden: true }) })
  }

  const parsed = productSchema.safeParse(body)
  if (!parsed.success) return invalid(parsed.error)
  const { slug, ...data } = parsed.data
  const product = await updateProduct(slug, data)
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
  return NextResponse.json({ product })
}

// Apaga de vez. Pedidos antigos guardam nome, preço e foto, então não são afetados.
export async function DELETE(request: NextRequest) {
  const denied = await guard(request)
  if (denied) return denied
  const slug = request.nextUrl.searchParams.get("slug") ?? ""
  if (!(await getStoredProduct(slug))) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
  await deleteProduct(slug)
  return NextResponse.json({ ok: true })
}
