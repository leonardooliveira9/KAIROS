import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/contexts/cart-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kairos - Terços Artesanais",
  description: "Terços artesanais feitos com amor e fé. Peças únicas por R$ 25,00.",
  generator: "",
  icons: {
    icon: [
      {
        url: "/kairo.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/kairo.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/kairo.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/kairo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <CartProvider>{children}</CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
