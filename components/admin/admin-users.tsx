"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, ShieldCheck, UserRound, Users } from "lucide-react"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

type Role = "admin" | "customer"

interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  ordersCount: number
}

export function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [me, setMe] = useState<string>("")
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState<string | null>(null)

  // carrega uma vez; o estado só muda quando a resposta chega
  useEffect(() => {
    let active = true
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (res) => {
        if (!active) return
        if (res.status === 401 || res.status === 403) return router.replace("/entrar?next=/admin/usuarios")
        const data = await res.json()
        if (!active) return
        setUsers(data.users)
        setMe(data.currentUserId)
      })
      .catch(() => toast.error("Não foi possível carregar os usuários"))
    return () => {
      active = false
    }
  }, [router])

  const changeRole = async (user: AdminUser, role: Role) => {
    const msg =
      role === "admin"
        ? `Dar acesso de ADMIN para ${user.name}? Essa pessoa poderá ver todos os pedidos e dados de clientes.`
        : `Remover o acesso de admin de ${user.name}?`
    if (!confirm(msg)) return
    setBusy(user.id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers((list) => list?.map((u) => (u.id === user.id ? { ...u, role } : u)) ?? null)
      toast.success(role === "admin" ? "Acesso de admin concedido" : "Acesso de admin removido")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar permissão")
    } finally {
      setBusy(null)
    }
  }

  const q = query.trim().toLowerCase()
  const visible = (users ?? []).filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q))
  const admins = (users ?? []).filter((u) => u.role === "admin").length

  return (
    <div className="container-k py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Painel Kairos</p>
          <h1 className="mt-1 font-serif text-3xl">Usuários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users ? `${users.length} contas • ${admins} ${admins === 1 ? "admin" : "admins"}` : "Carregando…"}
          </p>
        </div>
        <label className="relative w-full sm:w-72">
          <span className="sr-only">Buscar usuário</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nome ou e-mail…"
            className="h-10 w-full rounded-full border border-input bg-card pl-9 pr-4 text-sm outline-none focus:border-gold"
          />
        </label>
      </div>

      <div className="surface mt-6 overflow-hidden">
        {!users ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-sm text-muted-foreground">
            <Users className="mb-3 size-6 text-gold" /> Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-border/70 bg-secondary/50 text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Usuário</th>
                  <th className="px-5 py-3 font-medium">Cadastro</th>
                  <th className="px-5 py-3 font-medium">Pedidos</th>
                  <th className="px-5 py-3 font-medium">Permissão</th>
                  <th className="px-5 py-3 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visible.map((u) => {
                  const isMe = u.id === me
                  const isAdmin = u.role === "admin"
                  return (
                    <tr key={u.id}>
                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {u.name} {isMe && <span className="text-xs font-normal text-muted-foreground">(você)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDateTime(u.createdAt)}</td>
                      <td className="px-5 py-4">{u.ordersCount}</td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                            isAdmin ? "bg-gold-soft text-gold-strong" : "bg-secondary text-foreground/80",
                          )}
                        >
                          {isAdmin ? <ShieldCheck className="size-3" /> : <UserRound className="size-3" />}
                          {isAdmin ? "Admin" : "Cliente"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isMe ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy === u.id}
                            onClick={() => changeRole(u, isAdmin ? "customer" : "admin")}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs disabled:opacity-50",
                              isAdmin ? "border-destructive/30 text-destructive" : "border-border",
                            )}
                          >
                            {busy === u.id && <Loader2 className="size-3 animate-spin" />}
                            {isAdmin ? "Remover admin" : "Tornar admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
