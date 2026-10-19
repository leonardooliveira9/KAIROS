import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/password-recovery"

export const metadata: Metadata = { title: "Esqueci minha senha", robots: { index: false } }

export default function EsqueciSenhaPage() {
  return (
    <section className="container-k py-14 sm:py-20">
      <ForgotPasswordForm />
    </section>
  )
}
