export function AppleNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(0,0,0,0.8)] backdrop-blur-2xl">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="flex items-center justify-between h-11">
          <div className="flex items-center gap-8">
            <a href="/" className="text-white/80 hover:text-white text-xl font-semibold transition-colors">
              Terços
            </a>
            <div className="hidden md:flex items-center gap-8 text-xs">
              <a href="#classico" className="text-white/80 hover:text-white transition-colors">
                Clássico
              </a>
              <a href="#premium" className="text-white/80 hover:text-white transition-colors">
                Premium
              </a>
              <a href="#exclusivo" className="text-white/80 hover:text-white transition-colors">
                Exclusivo
              </a>
              <a href="#artesanal" className="text-white/80 hover:text-white transition-colors">
                Artesanal
              </a>
              <a href="/customize" className="text-white/80 hover:text-white transition-colors">
                Crie o seu
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
