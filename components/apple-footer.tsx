export function AppleFooter() {
  return (
    <footer className="bg-[#f5f5f7] text-[#6e6e73] py-12 px-6">
      <div className="max-w-[980px] mx-auto">
        <div className="border-b border-[#d2d2d7] pb-6 mb-6">
          <p className="text-xs leading-relaxed mb-4">
            Mais informações sobre como comprar nossos terços: ligue para 0800-000-0000
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-black mb-3">Comprar</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:underline">
                  Terço Clássico
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Terço Premium
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Terço Exclusivo
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-black mb-3">Valores</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:underline">
                  Artesanato
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Qualidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Tradição
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-black mb-3">Sobre</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:underline">
                  Nossa História
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Contato
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Garantia
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#d2d2d7] pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs">
            <p>Copyright © 2026 Terços Inc. Todos os direitos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:underline">
                Política de Privacidade
              </a>
              <a href="#" className="hover:underline">
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
