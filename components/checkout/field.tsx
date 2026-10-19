import { cn } from "@/lib/utils"

export function Field({
  label,
  name,
  error,
  className,
  hint,
  ...props
}: React.ComponentProps<"input"> & { label: string; name: string; error?: string; hint?: string }) {
  const id = `f-${name}`
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold focus:ring-2 focus:ring-gold/15 read-only:bg-secondary read-only:text-muted-foreground disabled:bg-secondary disabled:text-muted-foreground",
          error && "border-destructive focus:border-destructive focus:ring-destructive/15",
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-err`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
