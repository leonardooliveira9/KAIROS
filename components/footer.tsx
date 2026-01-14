export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6 bg-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4">Loja</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Coleção Completa
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Novidades
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Exclusivos
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contato
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Envio
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Devoluções
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Artesãos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Sustentabilidade
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Redes Sociais</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 Terços Premium. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
