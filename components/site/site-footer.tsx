import Link from "next/link"
import { BadgeCheck, Instagram, Mail, MessageCircle, Tag, Truck, Zap } from "lucide-react"
import { storeConfig, whatsappLink } from "@/lib/store-config"
import { formatBRL } from "@/lib/format"
import { Logo } from "./logo"

const navigation = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Catálogo de Terços" },
  { href: "/personalizar", label: "Monte seu Terço" },
  { href: "/sobre", label: "Nossa História" },
  { href: "/contato", label: "Contato & Apoio" },
]

const transparency = [
  { href: "/politicas/envio", label: "Políticas de Envio & Prazos" },
  { href: "/politicas/trocas", label: "Trocas e Devoluções" },
  { href: "/cuidados", label: "Cuidados com seu Terço" },
  { href: "/pedido", label: "Acompanhar Pedido" },
]

export function SiteFooter() {
  const { contact } = storeConfig
  const social = [
    { href: `https://instagram.com/${contact.instagram}`, label: "Instagram", icon: Instagram },
    { href: whatsappLink(), label: "WhatsApp", icon: MessageCircle },
    { href: `mailto:${contact.email}`, label: "E-mail", icon: Mail },
  ]

  return (
    <footer className="mt-auto border-t border-border/70 bg-card">
      <div className="container-k grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Terços artesanais concebidos como peças de contemplação, silêncio e devoção. Cada elo tecido com calma e
            oração.
          </p>
          <ul className="mt-5 flex gap-2">
            {social.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full bg-secondary text-foreground/80 transition-colors hover:bg-gold-soft hover:text-gold-strong"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <FooterColumn title="Navegação" links={navigation} />
        <FooterColumn title="Transparência" links={transparency} />

        <div className="rounded-2xl bg-secondary/70 p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <BadgeCheck className="size-4 text-gold" /> Selos de Confiança
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Zap className="size-4 text-gold" /> Pagamento 100% seguro via PIX
            </li>
            <li className="flex items-center gap-2.5">
              <Truck className="size-4 text-gold" /> Envio para todo o Brasil
            </li>
            <li className="flex items-center gap-2.5">
              <Tag className="size-4 text-gold" /> Preço único: {formatBRL(storeConfig.unitPrice)} cada
            </li>
          </ul>
        </div>
      </div>

      <div className="container-k flex flex-col gap-2 border-t border-border/70 py-6 text-xs tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright © {new Date().getFullYear()} Kairos Terços Artesanais. Feito à mão com amor e devoção.</p>
        <p>Serenidade e Arte Sacra Contemporânea</p>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em]">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
