import type { Metadata } from "next"
import { ResetPasswordForm } from "@/components/auth/password-recovery"

// sem referrer: o token da URL não vaza para outros sites carregados pela página
export const metadata: Metadata = { title: "Redefinir senha", robots: { index: false }, referrer: "no-referrer" }
export const dynamic = "force-dynamic"

export default async function RedefinirSenhaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <section className="container-k py-14 sm:py-20">
      <ResetPasswordForm token={typeof token === "string" ? token : ""} />
    </section>
  )
}
