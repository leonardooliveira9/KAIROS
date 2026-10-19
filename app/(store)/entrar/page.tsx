import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { currentUser } from "@/lib/server/auth"

export const metadata: Metadata = { title: "Entrar", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function EntrarPage() {
  if (await currentUser()) redirect("/conta")
  return (
    <section className="container-k py-14 sm:py-20">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </section>
  )
}
