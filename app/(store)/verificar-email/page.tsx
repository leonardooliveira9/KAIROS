import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, MailWarning } from "lucide-react"
import { currentUser } from "@/lib/server/auth"

export const metadata: Metadata = { title: "Confirmação de e-mail", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function VerificarEmailPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ok = (await searchParams).status === "ok"
  const loggedIn = Boolean(await currentUser())

  return (
    <section className="container-k py-14 sm:py-20">
      <div className="surface mx-auto w-full max-w-md p-6 text-center sm:p-8">
        {ok ? <CheckCircle2 className="mx-auto size-8 text-success" /> : <MailWarning className="mx-auto size-8 text-gold" />}
        <h1 className="mt-4 font-serif text-3xl">{ok ? "E-mail confirmado" : "Link inválido ou expirado"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ok
            ? "Pronto! Agora sua conta mostra também os pedidos feitos com este e-mail antes do cadastro."
            : "O link pode ter expirado (vale por 24 horas) ou já ter sido usado. Peça um novo em Minha conta."}
        </p>
        <Link
          href={loggedIn ? "/conta" : "/entrar?next=/conta"}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {loggedIn ? "Ir para minha conta" : "Entrar"}
        </Link>
      </div>
    </section>
  )
}
