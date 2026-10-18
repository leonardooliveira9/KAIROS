import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = ["Dados Pessoais", "Endereço de Entrega", "Pagamento PIX"]

export function CheckoutStepper({ current }: { current: number }) {
  return (
    <ol className="surface flex items-start justify-between gap-2 px-4 py-5 sm:px-10">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center text-center" aria-current={active ? "step" : undefined}>
            {i > 0 && (
              <span
                aria-hidden
                className={cn("absolute top-[17px] h-0.5", n <= current ? "bg-gold" : "bg-border")}
                style={{ left: "calc(-50% + 22px)", right: "calc(50% + 22px)" }}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-9 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                done && "border-gold bg-gold text-white dark:text-black",
                active && "border-gold bg-card text-gold-strong",
                !done && !active && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : n}
            </span>
            <span className={cn("mt-2 text-[11px] sm:text-[13px]", active || done ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
