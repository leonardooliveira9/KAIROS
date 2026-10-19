import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-3", className)} aria-label="Kairos — página inicial">
      <span className="flex flex-col items-start leading-none">
        <span className="flex items-center gap-1 font-serif text-lg font-medium tracking-[0.22em] text-foreground">
          <span className="text-gold text-xs">†</span>KAIROS
        </span>
        <span className="mt-1 pl-3.5 text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
          Terços artesanais
        </span>
      </span>
    </Link>
  )
}
