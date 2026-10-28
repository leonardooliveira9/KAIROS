import crypto from "crypto"
import fs from "fs/promises"
import path from "path"
import { NextResponse, type NextRequest } from "next/server"
import { put } from "@vercel/blob"
import { requireRole, sameOrigin } from "@/lib/server/auth"

export const runtime = "nodejs"

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }
// a foto já chega reduzida pelo navegador; o limite da Vercel para o corpo é 4,5 MB
const MAX_BYTES = 4 * 1024 * 1024

/**
 * Foto de produto enviada pelo admin.
 * - Com BLOB_READ_WRITE_TOKEN (Vercel > Storage > Blob): guarda no Vercel Blob e devolve a URL pública;
 * - sem ele, fora de produção: grava em public/uploads (só para desenvolvimento).
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  const auth = await requireRole(request, "admin")
  if (auth instanceof NextResponse) return auth

  const file = (await request.formData().catch(() => null))?.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ error: "Use uma foto JPG, PNG ou WebP." }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "A foto passou de 4 MB." }, { status: 400 })

  const name = `produtos/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(name, file, { access: "public", contentType: file.type })
      return NextResponse.json({ url: blob.url })
    } catch (err) {
      console.error("[upload] Vercel Blob", err)
      return NextResponse.json({ error: "Não foi possível guardar a foto. Tente de novo." }, { status: 502 })
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[upload] BLOB_READ_WRITE_TOKEN não configurado")
    return NextResponse.json(
      { error: "Envio de fotos não configurado: ative o Vercel Blob no projeto (Storage > Blob)." },
      { status: 503 },
    )
  }
  const target = path.join(process.cwd(), "public", "uploads", name)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, Buffer.from(await file.arrayBuffer()))
  return NextResponse.json({ url: `/uploads/${name}` })
}
