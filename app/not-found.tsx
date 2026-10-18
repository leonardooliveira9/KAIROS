import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="mt-3 font-serif text-4xl">Esta página se perdeu no tempo.</h1>
      <p className="mt-3 text-muted-foreground">Mas o momento certo para orar é sempre agora.</p>
      <Link href="/" className="mt-8 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground">
        Voltar ao início
      </Link>
    </main>
  )
}
