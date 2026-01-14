import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-semibold tracking-tight">Terços</h1>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#colecao" className="text-foreground/60 hover:text-foreground transition-colors">
              Coleção
            </a>
            <a href="#artesanal" className="text-foreground/60 hover:text-foreground transition-colors">
              Artesanal
            </a>
            <a href="#materiais" className="text-foreground/60 hover:text-foreground transition-colors">
              Materiais
            </a>
            <a href="#suporte" className="text-foreground/60 hover:text-foreground transition-colors">
              Suporte
            </a>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
