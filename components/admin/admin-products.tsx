"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  EyeOff,
  ImagePlus,
  Loader2,
  Package,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Field } from "@/components/checkout/field"
import { Switch } from "@/components/ui/switch"
import { productColors, type Product } from "@/lib/products"
import { storeConfig } from "@/lib/store-config"
import { formatBRL } from "@/lib/format"
import { cn } from "@/lib/utils"

type Draft = Omit<Product, "price"> & { price: string }

const emptyDraft: Draft = {
  slug: "",
  name: "",
  price: String(storeConfig.unitPrice),
  color: "azul",
  badge: "",
  materials: "",
  description: "",
  note: "",
  longDescription: "",
  images: [],
  specs: [],
  highlights: [],
  available: true,
}

/** "Terço São Bento!" → "terco-sao-bento" */
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

/** Reduz a foto no navegador (lado maior até 1600 px, JPEG) para caber no envio e carregar rápido na loja */
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Não foi possível ler a foto"))), "image/jpeg", 0.85),
  )
}

async function api(method: string, body?: unknown, query = "") {
  const res = await fetch(`/api/admin/products${query}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || "Erro no servidor"), { fields: data.fields, status: res.status })
  return data
}

export function AdminProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [editing, setEditing] = useState<{ draft: Draft; isNew: boolean } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await api("GET")
      setProducts(data.products)
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status === 401 || status === 403) router.replace("/entrar?next=/admin/produtos")
      else toast.error("Não foi possível carregar os produtos")
    }
  }, [router])

  useEffect(() => {
    // falso positivo: load só muda o estado depois do await
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const toggle = async (p: Product) => {
    setBusy(p.slug)
    try {
      const { slug, ...rest } = p
      await api("PATCH", { slug, ...rest, available: !p.available })
      setProducts((list) => list?.map((x) => (x.slug === p.slug ? { ...x, available: !p.available } : x)) ?? null)
      toast.success(p.available ? "Produto escondido da loja" : "Produto à venda na loja")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setBusy(null)
    }
  }

  const move = async (p: Product, direction: -1 | 1) => {
    setBusy(p.slug)
    try {
      const data = await api("PATCH", { slug: p.slug, move: direction })
      setProducts(data.products)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao mover")
    } finally {
      setBusy(null)
    }
  }

  const remove = async (p: Product) => {
    if (!confirm(`Apagar "${p.name}" de vez? Pedidos antigos não são afetados. Para só tirar da loja, use o botão "À venda".`)) return
    setBusy(p.slug)
    try {
      await api("DELETE", undefined, `?slug=${encodeURIComponent(p.slug)}`)
      setProducts((list) => list?.filter((x) => x.slug !== p.slug) ?? null)
      toast.success("Produto apagado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao apagar")
    } finally {
      setBusy(null)
    }
  }

  if (editing) {
    return (
      <ProductEditor
        initial={editing.draft}
        isNew={editing.isNew}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />
    )
  }

  return (
    <div className="container-k py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Painel Kairos</p>
          <h1 className="mt-1 font-serif text-3xl">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">A ordem desta lista é a ordem da loja; os 3 primeiros aparecem na página inicial.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ draft: emptyDraft, isNew: true })}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="size-4" /> Novo produto
        </button>
      </header>

      <div className="surface mt-8 overflow-hidden">
        {!products ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <Package className="mb-3 size-6 text-gold" />
            Nenhum produto. Clique em “Novo produto” para cadastrar o primeiro.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {products.map((p, i) => (
              <li key={p.slug} className={cn("flex flex-wrap items-center gap-4 px-4 py-3 sm:px-5", !p.available && "bg-secondary/40")}>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(p, -1)}
                    disabled={i === 0 || busy !== null}
                    aria-label={`Subir ${p.name}`}
                    className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(p, 1)}
                    disabled={i === products.length - 1 || busy !== null}
                    aria-label={`Descer ${p.name}`}
                    className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="56px" className={cn("object-cover", !p.available && "opacity-50")} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {p.name}
                    {i < 3 && p.available && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-medium text-gold-strong">
                        <Star className="size-3" /> Página inicial
                      </span>
                    )}
                    {!p.available && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                        <EyeOff className="size-3" /> Fora da loja
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatBRL(p.price)} • {productColors.find((c) => c.id === p.color)?.label} • /produtos/{p.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={p.available} onCheckedChange={() => toggle(p)} disabled={busy !== null} aria-label={`À venda: ${p.name}`} />
                    À venda
                  </label>
                  {p.available && (
                    <Link
                      href={`/produtos/${p.slug}`}
                      target="_blank"
                      aria-label={`Ver ${p.name} na loja`}
                      className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing({ draft: { ...p, price: String(p.price) }, isNew: false })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs"
                  >
                    <Pencil className="size-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={busy !== null}
                    aria-label={`Apagar ${p.name}`}
                    className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                  >
                    {busy === p.slug ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ProductEditor({
  initial,
  isNew,
  onCancel,
  onSaved,
}: {
  initial: Draft
  isNew: boolean
  onCancel: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  // em produto novo, o endereço acompanha o nome até ser editado à mão
  const slugTouched = useRef(!isNew)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    if (errors[key as string]) setErrors((e) => ({ ...e, [key]: "" }))
  }

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const room = 8 - draft.images.length
    const list = [...files].slice(0, room)
    if (files.length > room) toast.error("No máximo 8 fotos por produto")
    setUploading((n) => n + list.length)
    for (const file of list) {
      try {
        const body = new FormData()
        body.append("file", await shrinkImage(file), "foto.jpg")
        const res = await fetch("/api/admin/upload", { method: "POST", body })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Erro ao enviar a foto")
        setDraft((d) => ({ ...d, images: [...d.images, data.url] }))
        setErrors((e) => ({ ...e, images: "" }))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao enviar a foto")
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const moveImage = (i: number, to: number) =>
    setDraft((d) => {
      const images = [...d.images]
      const [img] = images.splice(i, 1)
      images.splice(to, 0, img)
      return { ...d, images }
    })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...draft,
        price: Number(draft.price.replace(",", ".")),
        specs: draft.specs.filter((s) => s.label.trim() && s.value.trim()),
        highlights: draft.highlights.filter((h) => h.title.trim() && h.text.trim()),
      }
      await api(isNew ? "POST" : "PATCH", body)
      toast.success(isNew ? "Produto criado" : "Produto salvo")
      onSaved()
    } catch (err) {
      setErrors((err as { fields?: Record<string, string> }).fields ?? {})
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const textarea =
    "w-full resize-y rounded-xl border border-input bg-card px-3.5 py-3 text-[15px] outline-none placeholder:text-muted-foreground/70 focus:border-gold focus:ring-2 focus:ring-gold/15"

  return (
    <form onSubmit={save} noValidate className="container-k max-w-4xl py-8">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar para produtos
      </button>
      <h1 className="mt-3 font-serif text-3xl">{isNew ? "Novo produto" : `Editar ${initial.name}`}</h1>

      <section className="surface mt-6 grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <Field
          className="sm:col-span-2"
          label="Nome"
          name="name"
          value={draft.name}
          onChange={(e) => {
            set("name", e.target.value)
            if (!slugTouched.current) set("slug", slugify(e.target.value))
          }}
          error={errors.name}
          placeholder="Terço São Bento"
        />
        <Field
          label="Endereço na loja"
          name="slug"
          value={draft.slug}
          onChange={(e) => {
            slugTouched.current = true
            set("slug", slugify(e.target.value))
          }}
          readOnly={!isNew}
          error={errors.slug}
          hint={isNew ? `kairos…/produtos/${draft.slug || "terco-sao-bento"}` : "Não muda depois de criado (links e pedidos usam ele)."}
        />
        <Field
          label="Preço (R$)"
          name="price"
          inputMode="decimal"
          value={draft.price}
          onChange={(e) => set("price", e.target.value.replace(/[^\d.,]/g, ""))}
          error={errors.price}
        />
        <div className="space-y-1.5">
          <label htmlFor="f-color" className="text-[13px] font-medium">Cor (filtro da loja)</label>
          <select
            id="f-color"
            value={draft.color}
            onChange={(e) => set("color", e.target.value as Draft["color"])}
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-[15px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/15"
          >
            {productColors.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <Field label="Selo na foto" name="badge" value={draft.badge} onChange={(e) => set("badge", e.target.value)} error={errors.badge} placeholder="Mais procurado (opcional)" />
        <Field
          className="sm:col-span-2"
          label="Materiais (linha curta)"
          name="materials"
          value={draft.materials}
          onChange={(e) => set("materials", e.target.value)}
          error={errors.materials}
          placeholder="Fio náutico • Feito à mão"
        />
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="f-description" className="text-[13px] font-medium">Descrição curta (card e busca)</label>
          <textarea id="f-description" rows={2} maxLength={240} value={draft.description} onChange={(e) => set("description", e.target.value)} className={cn(textarea, errors.description && "border-destructive")} />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>
        <Field className="sm:col-span-2" label="Frase em destaque" name="note" value={draft.note} onChange={(e) => set("note", e.target.value)} placeholder="Perfeito para momentos de paz… (opcional)" />
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="f-long" className="text-[13px] font-medium">Descrição completa (página do produto)</label>
          <textarea id="f-long" rows={4} maxLength={2000} value={draft.longDescription} onChange={(e) => set("longDescription", e.target.value)} className={textarea} />
        </div>
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <Switch checked={draft.available} onCheckedChange={(v) => set("available", v)} />
          À venda na loja
        </label>
      </section>

      <section className="surface mt-4 p-5 sm:p-6" aria-labelledby="fotos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="fotos" className="font-serif text-xl">Fotos</h2>
            <p className="text-xs text-muted-foreground">A primeira é a capa. Até 8 fotos; elas são reduzidas antes de enviar.</p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={draft.images.length >= 8}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-50"
          >
            <ImagePlus className="size-4" /> Adicionar fotos
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {draft.images.map((src, i) => (
            <li key={`${src}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl bg-secondary">
              <Image src={src} alt={`Foto ${i + 1}`} fill sizes="200px" className="object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-medium">Capa</span>}
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1">
                <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0} aria-label="Mover para a esquerda" className="rounded-full bg-card/95 p-1.5 disabled:opacity-30">
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => set("images", draft.images.filter((_, j) => j !== i))}
                  aria-label="Tirar esta foto"
                  className="rounded-full bg-card/95 p-1.5 text-destructive"
                >
                  <X className="size-3.5" />
                </button>
                <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === draft.images.length - 1} aria-label="Mover para a direita" className="rounded-full bg-card/95 p-1.5 disabled:opacity-30">
                  <ArrowLeft className="size-3.5 rotate-180" />
                </button>
              </div>
            </li>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <li key={`up-${i}`} className="flex aspect-square items-center justify-center rounded-xl bg-secondary">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </li>
          ))}
        </ul>
        {errors.images && <p className="mt-2 text-xs text-destructive">{errors.images}</p>}
      </section>

      <section className="surface mt-4 p-5 sm:p-6">
        <h2 className="font-serif text-xl">Ficha técnica</h2>
        <p className="text-xs text-muted-foreground">Ex.: Contas principais → Acrílico azul 8mm. Linhas vazias são ignoradas.</p>
        <div className="mt-4 space-y-2">
          {draft.specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input aria-label="Item" value={s.label} onChange={(e) => set("specs", draft.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Item" className="h-10 w-2/5 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-gold" />
              <input aria-label="Valor" value={s.value} onChange={(e) => set("specs", draft.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Valor" className="h-10 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-gold" />
              <button type="button" onClick={() => set("specs", draft.specs.filter((_, j) => j !== i))} aria-label="Tirar linha" className="rounded-full p-2 text-muted-foreground hover:text-destructive">
                <X className="size-4" />
              </button>
            </div>
          ))}
          {draft.specs.length < 10 && (
            <button type="button" onClick={() => set("specs", [...draft.specs, { label: "", value: "" }])} className="inline-flex items-center gap-1.5 text-sm text-gold-strong">
              <Plus className="size-4" /> Adicionar linha
            </button>
          )}
        </div>
      </section>

      <section className="surface mt-4 p-5 sm:p-6">
        <h2 className="font-serif text-xl">Destaques</h2>
        <p className="text-xs text-muted-foreground">Até 6 blocos de título + texto na página do produto.</p>
        <div className="mt-4 space-y-3">
          {draft.highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input aria-label="Título" value={h.title} onChange={(e) => set("highlights", draft.highlights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Título" className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-gold" />
                <textarea aria-label="Texto" rows={2} value={h.text} onChange={(e) => set("highlights", draft.highlights.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="Texto" className={cn(textarea, "text-sm")} />
              </div>
              <button type="button" onClick={() => set("highlights", draft.highlights.filter((_, j) => j !== i))} aria-label="Tirar destaque" className="self-start rounded-full p-2 text-muted-foreground hover:text-destructive">
                <X className="size-4" />
              </button>
            </div>
          ))}
          {draft.highlights.length < 6 && (
            <button type="button" onClick={() => set("highlights", [...draft.highlights, { title: "", text: "" }])} className="inline-flex items-center gap-1.5 text-sm text-gold-strong">
              <Plus className="size-4" /> Adicionar destaque
            </button>
          )}
        </div>
      </section>

      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-border/70 bg-background/95 py-4 backdrop-blur">
        <button type="button" onClick={onCancel} className="rounded-full px-5 py-3 text-sm text-muted-foreground hover:text-foreground">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || uploading > 0}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />} {isNew ? "Criar produto" : "Salvar alterações"}
        </button>
      </div>
    </form>
  )
}
