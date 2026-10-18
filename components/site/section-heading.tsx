import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
  as?: "h1" | "h2"
}) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag
        className={cn(
          "mt-3 font-serif font-normal leading-[1.1] tracking-tight text-balance",
          Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
        )}
      >
        {title}
      </Tag>
      {description && <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}
