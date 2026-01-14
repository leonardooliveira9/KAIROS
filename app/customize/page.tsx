"use client"

import { AppleNav } from "@/components/apple-nav"
import { RosaryCustomizer } from "@/components/rosary-customizer"

export default function CustomizePage() {
  return (
    <main className="min-h-screen bg-white">
      <AppleNav />
      <div className="pt-11">
        <RosaryCustomizer />
      </div>
    </main>
  )
}
