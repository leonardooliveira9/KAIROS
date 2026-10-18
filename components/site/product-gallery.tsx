"use client"

import Image from "next/image"
import { useState } from "react"
import { ZoomIn } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-secondary sm:aspect-[5/6]">
        <Image
          src={images[index]}
          alt={`${name} — foto ${index + 1}`}
          fill
          priority
          sizes="(min-width:1024px) 560px, 100vw"
          className="object-cover"
        />
        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur">
          <span className="size-1.5 rounded-full bg-gold" /> Feito à mão
        </span>
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="absolute bottom-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-card/95 shadow-md transition-transform hover:scale-105"
          aria-label="Ampliar foto"
        >
          <ZoomIn className="size-4" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 bg-secondary transition-all",
                i === index ? "border-foreground" : "border-transparent opacity-75 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="140px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-[min(92vw,900px)] overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-[min(92vw,900px)]">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card">
            <Image src={images[index]} alt={name} fill sizes="900px" className="object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
