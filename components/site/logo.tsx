import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-3", className)} aria-label="Kairos — página inicial">
      <span className="flex flex-col items-start leading-none">
        <span className="flex items-center gap-1 font-serif text-[15px] font-medium tracking-[0.22em] text-foreground">
          <span className="text-gold text-[11px]">†</span>KAIROS
        </span>
        <span className="mt-0.5 pl-3 text-[7px] uppercase tracking-[0.28em] text-muted-foreground">
          Terços artesanais
        </span>
      </span>
      <span className="hidden h-6 w-px bg-border sm:block" />
      <span className="hidden items-center gap-1 font-serif text-xl text-foreground sm:flex">
        Kairos <span className="text-gold text-sm">†</span>
      </span>
    </Link>
  )
}
