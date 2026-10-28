"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useCart } from "@/contexts/cart-context"
import { formatBRL } from "@/lib/format"

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const { products } = useCart()

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Buscar" description="Busque um terço pelo nome ou cor">
      <CommandInput placeholder="Buscar terço, cor ou material…" />
      <CommandList>
        <CommandEmpty>Nenhum terço encontrado.</CommandEmpty>
        <CommandGroup heading="Terços">
          {products.map((p) => (
            <CommandItem
              key={p.slug}
              value={`${p.name} ${p.color} ${p.materials} ${p.badge}`}
              onSelect={() => go(`/produtos/${p.slug}`)}
              className="gap-3 py-2"
            >
              <Image src={p.images[0]} alt="" width={40} height={40} className="size-10 rounded-md object-cover" />
              <span className="flex-1">
                <span className="block text-sm">{p.name}</span>
                <span className="block text-xs text-muted-foreground">{p.materials}</span>
              </span>
              <span className="text-xs text-muted-foreground">{formatBRL(p.price)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Páginas">
          <CommandItem onSelect={() => go("/pedido")}>Acompanhar meu pedido</CommandItem>
          <CommandItem onSelect={() => go("/politicas/envio")}>Políticas de envio e prazos</CommandItem>
          <CommandItem onSelect={() => go("/politicas/trocas")}>Trocas e devoluções</CommandItem>
          <CommandItem onSelect={() => go("/cuidados")}>Cuidados com seu terço</CommandItem>
          <CommandItem onSelect={() => go("/contato")}>Contato e apoio</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
