import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { currentUser } from "@/lib/server/auth"

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function CadastrarPage() {
  if (await currentUser()) redirect("/conta")
  return (
    <section className="container-k py-14 sm:py-20">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </section>
  )
}
