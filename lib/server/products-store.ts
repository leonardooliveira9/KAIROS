import "server-only"
import { seedProducts, type Product } from "@/lib/products"
import { allDocs, deleteDoc, DuplicateError, getDoc, insertDoc, putDoc } from "./db"

/*
 * Catálogo de produtos, guardado no banco (tabela products). O id do documento é o slug.
 * Na primeira leitura com a tabela vazia, copia o catálogo inicial de lib/products.ts.
 */

export interface StoredProduct extends Product {
  id: string
  createdAt: string
  /** Ordem na loja (menor primeiro) */
  position: number
}

const g = globalThis as unknown as { __kairosSeeded?: Promise<void> }

/** Documento-marca: o catálogo inicial já foi copiado (apagar todos os produtos não o traz de volta) */
const SEED_MARKER = "__catalogo_inicial__"

const ignoreDuplicate = (err: unknown) => {
  if (!(err instanceof DuplicateError)) throw err
}

async function ensureSeeded() {
  g.__kairosSeeded ??= (async () => {
    if (await getDoc("products", SEED_MARKER)) return
    if ((await allDocs<StoredProduct>("products")).length === 0) {
      const now = Date.now()
      for (const [i, p] of seedProducts.entries()) {
        // createdAt crescente só para desempate; a ordem vem de position
        const doc: StoredProduct = { ...p, id: p.slug, createdAt: new Date(now + i).toISOString(), position: i }
        // outro servidor pode estar semeando ao mesmo tempo: ignora o que já existe
        await insertDoc("products", doc).catch(ignoreDuplicate)
      }
    }
    await insertDoc("products", { id: SEED_MARKER, createdAt: new Date(0).toISOString() }).catch(ignoreDuplicate)
  })().catch((err) => {
    g.__kairosSeeded = undefined
    throw err
  })
  return g.__kairosSeeded
}

const byPosition = (a: StoredProduct, b: StoredProduct) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)

/** Produtos na ordem da loja; `includeHidden` também traz os marcados como indisponíveis (para o admin) */
export async function listProducts({ includeHidden = false } = {}) {
  await ensureSeeded()
  const all = (await allDocs<StoredProduct>("products")).filter((p) => p.id !== SEED_MARKER).sort(byPosition)
  return includeHidden ? all : all.filter((p) => p.available)
}

/** Produto à venda pelo slug (indisponível volta undefined) */
export async function getProduct(slug: string) {
  const p = await getStoredProduct(slug)
  return p?.available ? p : undefined
}

export async function getStoredProduct(slug: string) {
  if (slug === SEED_MARKER) return undefined
  await ensureSeeded()
  return getDoc<StoredProduct>("products", slug)
}

/** Cria um produto no fim da lista; lança DuplicateError se o slug já existir */
export async function createProduct(product: Product) {
  const all = await listProducts({ includeHidden: true })
  const position = all.length ? Math.max(...all.map((p) => p.position)) + 1 : 0
  return insertDoc<StoredProduct>("products", { ...product, id: product.slug, createdAt: new Date().toISOString(), position })
}

/** Atualiza os dados de um produto (o slug não muda: pedidos e links antigos apontam para ele) */
export async function updateProduct(slug: string, data: Omit<Product, "slug">) {
  const current = await getStoredProduct(slug)
  if (!current) return undefined
  return putDoc<StoredProduct>("products", { ...current, ...data, slug, id: slug })
}

/** Troca a posição com o vizinho de cima (-1) ou de baixo (+1) */
export async function moveProduct(slug: string, direction: -1 | 1) {
  const all = await listProducts({ includeHidden: true })
  const i = all.findIndex((p) => p.slug === slug)
  const j = i + direction
  if (i < 0 || j < 0 || j >= all.length) return
  // renumera tudo para não depender de posições repetidas
  const order = all.map((p) => p.slug)
  ;[order[i], order[j]] = [order[j], order[i]]
  for (const [position, s] of order.entries()) {
    const p = all.find((x) => x.slug === s)!
    if (p.position !== position) await putDoc("products", { ...p, position })
  }
}

export function deleteProduct(slug: string) {
  return deleteDoc("products", slug)
}

/** Só os campos do produto, sem os de controle do banco (para mandar ao navegador) */
export function toProduct({ id: _id, createdAt: _createdAt, position: _position, ...product }: StoredProduct): Product {
  return product
}
