import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Newsreader } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/contexts/cart-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: { default: "Kairos — Terços Artesanais", template: "%s · Kairos Terços Artesanais" },
  description:
    "Terços artesanais feitos à mão com amor e fé. Peças únicas por R$ 25,00, pagamento via PIX e envio para todo o Brasil.",
  icons: { icon: "/kairo.png", apple: "/kairo.png" },
  openGraph: {
    title: "Kairos — Terços Artesanais",
    description: "Terços feitos à mão com amor e fé. Preço único de R$ 25,00.",
    images: ["/Terços.jpg"],
    locale: "pt_BR",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${newsreader.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
          <Toaster position="bottom-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
