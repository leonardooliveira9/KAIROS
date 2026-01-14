import { Mail, Phone, MapPin } from "lucide-react"

export function StoreFooter() {
  return (
    <footer id="contato" className="bg-foreground text-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Terços Artesanais</h3>
            <p className="text-background/70 mb-4 max-w-md">
              Peças únicas feitas à mão com materiais nobres. Fé, tradição e qualidade em cada detalhe.
            </p>
            <div className="flex gap-4">
              <img
                src="/elegant-rosary-beads-on-minimalist-white-surface.jpg"
                alt="Terço"
                className="w-16 h-16 object-cover rounded-lg opacity-70"
              />
              <img
                src="/crystal-rosary-beads-elegant.jpg"
                alt="Terço cristal"
                className="w-16 h-16 object-cover rounded-lg opacity-70"
              />
              <img
                src="/gemstone-rosary-beads-premium-elegant.jpg"
                alt="Terço pedras"
                className="w-16 h-16 object-cover rounded-lg opacity-70"
              />
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-background/70">
              <li>
                <a href="#produtos" className="hover:text-background transition-colors">
                  Produtos
                </a>
              </li>
              <li>
                <a href="#sobre" className="hover:text-background transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Termos de Uso
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>(11) 99999-9999</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>contato@tercos.com.br</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1" />
                <span>São Paulo - SP</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-6 text-center text-background/50 text-sm">
          <p>&copy; 2026 Terços Artesanais. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
