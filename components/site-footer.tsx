import Link from "next/link"
import { Instagram, Mail, Phone } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">KAIROS</h3>
            <p className="text-background/70 text-sm leading-relaxed">
              Terços artesanais feitos com amor e dedicação. Cada peça é única e carrega consigo uma história de fé.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Navegação</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-background/70 hover:text-background text-sm transition-colors">
                Home
              </Link>
              <Link href="/produtos" className="text-background/70 hover:text-background text-sm transition-colors">
                Produtos
              </Link>
              <Link href="/sobre" className="text-background/70 hover:text-background text-sm transition-colors">
                Sobre
              </Link>
              <Link href="/contato" className="text-background/70 hover:text-background text-sm transition-colors">
                Contato
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <div className="space-y-3 text-sm">
              <a
                href="tel:+5511999999999"
                className="flex items-center gap-2 text-background/70 hover:text-background transition-colors"
              >
                <Phone className="w-4 h-4" />
                (11) 99999-9999
              </a>
              <a
                href="mailto:contato@kairos.com.br"
                className="flex items-center gap-2 text-background/70 hover:text-background transition-colors"
              >
                <Mail className="w-4 h-4" />
                contato@kairos.com.br
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-background/70 hover:text-background transition-colors"
              >
                <Instagram className="w-4 h-4" />
                @kairos.tercos
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center">
          <p className="text-background/50 text-sm">&copy; 2026 Kairos. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
