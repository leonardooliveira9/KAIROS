import type { Metadata } from "next"
import { Instagram, Mail, MessageCircle } from "lucide-react"
import { SectionHeading } from "@/components/site/section-heading"
import { ContactForm } from "@/components/site/contact-form"
import { storeConfig, whatsappLink } from "@/lib/store-config"

export const metadata: Metadata = {
  title: "Contato & Apoio",
  description: "Fale com a Kairos pelo WhatsApp, Instagram ou e-mail.",
}

export default function ContatoPage() {
  const { contact } = storeConfig
  const channels = [
    { icon: MessageCircle, label: "WhatsApp", value: contact.whatsappLabel, href: whatsappLink("Olá! Vim pelo site da Kairos."), note: "Resposta mais rápida" },
    { icon: Instagram, label: "Instagram", value: `@${contact.instagram}`, href: `https://instagram.com/${contact.instagram}`, note: "Novidades e bastidores" },
    { icon: Mail, label: "E-mail", value: contact.email, href: `mailto:${contact.email}`, note: "Respondemos em até 1 dia útil" },
  ]

  return (
    <section className="py-14 sm:py-20">
      <div className="container-k">
        <SectionHeading
          as="h1"
          eyebrow="Contato & apoio"
          title="Estamos aqui para você."
          description="Dúvidas sobre pedidos, presentes ou encomendas especiais? Escreva para nós."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <ContactForm />
          <ul className="space-y-4">
            {channels.map(({ icon: Icon, label, value, href, note }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" className="surface flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-gold-soft text-gold-strong">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
                    <span className="block font-serif text-lg">{value}</span>
                    <span className="block text-xs text-muted-foreground">{note}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
