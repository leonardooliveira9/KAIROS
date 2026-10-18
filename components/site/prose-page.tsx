import type React from "react"
import { SectionHeading } from "./section-heading"

export function ProsePage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="py-14 sm:py-20">
      <div className="container-k">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} description={description} />
        <div className="surface mt-10 max-w-3xl space-y-6 p-6 text-[15px] leading-relaxed text-muted-foreground sm:p-10 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-foreground [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </section>
  )
}
