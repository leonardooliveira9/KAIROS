"use client"

import type { Auth } from "firebase/auth"

// Valores públicos do app web do Firebase (ver .env.example)
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.authDomain)

/**
 * Com NEXT_PUBLIC_FIREBASE_AUTH_PROXY=true, o login usa o próprio domínio da loja
 * (as rotas /__/auth são repassadas ao Firebase em next.config.mjs). Exige o endereço
 * https://SEU-DOMINIO/__/auth/handler nos "URIs de redirecionamento autorizados" do
 * cliente OAuth no Google Cloud. Em localhost continua usando o domínio do Firebase.
 */
function authDomain() {
  const proxy = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROXY === "true"
  const { hostname, host } = window.location
  return proxy && hostname !== "localhost" && hostname !== "127.0.0.1" ? host : config.authDomain
}

let authPromise: Promise<Auth> | null = null

/** Carrega o SDK só quando alguém entra com o Google — não pesa nas outras páginas */
export function getFirebaseAuth() {
  if (!firebaseConfigured) return Promise.reject(new Error("Firebase não configurado"))
  authPromise ??= (async () => {
    const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([import("firebase/app"), import("firebase/auth")])
    const app = getApps()[0] ?? initializeApp({ ...config, authDomain: authDomain() })
    const auth = getAuth(app)
    auth.languageCode = "pt-BR"
    return auth
  })()
  return authPromise
}

/** Mensagens amigáveis para os erros mais comuns do Firebase Auth */
export function firebaseErrorMessage(err: unknown) {
  const code = (err as { code?: string })?.code ?? ""
  const messages: Record<string, string> = {
    "auth/popup-closed-by-user": "A janela do Google foi fechada antes de concluir.",
    "auth/cancelled-popup-request": "A janela do Google foi fechada antes de concluir.",
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Libere pop-ups e tente de novo.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase (Authentication > Domínios autorizados).",
    "auth/operation-not-allowed": "Este método de login não está ativado no Firebase.",
    "auth/network-request-failed": "Sem conexão com o Firebase. Verifique a internet.",
  }
  if (code) console.error("[firebase]", code, err)
  // o código ajuda no diagnóstico quando o erro não está na lista acima
  return messages[code] ?? `Algo deu errado. Tente de novo.${code ? ` (${code})` : ""}`
}
