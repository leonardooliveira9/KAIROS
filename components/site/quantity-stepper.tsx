"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "sm",
  label = "Quantidade",
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: "sm" | "md"
  label?: string
}) {
  const btn = cn(
    "inline-flex items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-card hover:text-foreground disabled:opacity-40",
    size === "sm" ? "size-7" : "size-9",
  )
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-full bg-secondary", size === "sm" ? "p-0.5" : "p-1")}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Diminuir">
        <Minus className="size-3.5" />
      </button>
      <span className={cn("text-center text-sm tabular-nums", size === "sm" ? "w-7" : "w-10")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar">
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
