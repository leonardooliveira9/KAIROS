"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface ScrollSectionProps {
  children: React.ReactNode
  className?: string
}

export function ScrollSection({ children, className = "" }: ScrollSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visibility, setVisibility] = useState({ opacity: 0, scale: 0.95 })

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect
          const windowHeight = window.innerHeight
          const sectionMiddle = rect.top + rect.height / 2
          const viewportMiddle = windowHeight / 2

          // Calcula distância do centro da seção ao centro da viewport
          const distance = Math.abs(sectionMiddle - viewportMiddle)
          const maxDistance = windowHeight

          // Quanto mais próximo do centro, maior a opacidade e escala
          const progress = Math.max(0, 1 - distance / maxDistance)

          setVisibility({
            opacity: progress,
            scale: 0.95 + progress * 0.05,
          })
        })
      },
      {
        threshold: Array.from({ length: 100 }, (_, i) => i / 100),
        rootMargin: "-10% 0px -10% 0px",
      },
    )

    observer.observe(section)

    // Atualiza ao fazer scroll
    const handleScroll = () => {
      const rect = section.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const sectionMiddle = rect.top + rect.height / 2
      const viewportMiddle = windowHeight / 2

      const distance = Math.abs(sectionMiddle - viewportMiddle)
      const maxDistance = windowHeight

      const progress = Math.max(0, 1 - distance / maxDistance)

      setVisibility({
        opacity: progress,
        scale: 0.95 + progress * 0.05,
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Calcula inicial

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{
        opacity: visibility.opacity,
        transform: `scale(${visibility.scale})`,
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
      }}
    >
      {children}
    </div>
  )
}
