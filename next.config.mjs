/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Páginas do login do Firebase servidas pelo próprio domínio da loja (/__/auth/...).
  // Usadas quando NEXT_PUBLIC_FIREBASE_AUTH_PROXY=true: a janela do Google deixa de depender
  // de firebaseapp.com, que alguns navegadores, extensões e antivírus bloqueiam.
  async rewrites() {
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    if (!authDomain) return []
    return [{ source: "/__/auth/:path*", destination: `https://${authDomain}/__/auth/:path*` }]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ]
  },
}

export default nextConfig
