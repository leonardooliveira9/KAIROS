"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type Role = "admin" | "customer"

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  cpf?: string
  createdAt: string
  emailVerifiedAt?: string
  phoneVerifiedAt?: string
  hasPassword: boolean
  googleLinked: boolean
}

/** Conta pronta para comprar: e-mail e telefone confirmados */
export const isFullyVerified = (u: SessionUser | null) => Boolean(u?.emailVerifiedAt && u?.phoneVerifiedAt && u?.phone)

interface AuthContextType {
  user: SessionUser | null
  loading: boolean
  refresh: () => Promise<SessionUser | null>
  setUser: (user: SessionUser | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Usuário da sessão atual (null se não estiver logado ou se a consulta falhar) */
async function fetchSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" })
    const data = await res.json()
    return data.user ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const current = await fetchSessionUser()
    setUser(current)
    setLoading(false)
    return current
  }, [])

  // sessão inicial: o estado só muda quando a resposta chega
  useEffect(() => {
    let active = true
    fetchSessionUser().then((current) => {
      if (!active) return
      setUser(current)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, refresh, setUser, logout }), [user, loading, refresh, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
