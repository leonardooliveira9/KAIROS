"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  clientName: string
  email: string
  phone: string
  cpf: string
  address: string
  city: string
  state: string
  zipCode: string
  observations: string
  items: OrderItem[]
  total: number
  pixKey: string
  qrCode: string
  status: "pending" | "paid" | "confirmed"
  createdAt: string
  paidAt?: string
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "confirmed">("all")
  const router = useRouter()

  // Removed useEffect of authentication - direct access to the dashboard

  const handleLogout = async () => {
    router.push("/")
  }

  const handleStatusChange = async (orderId: string, newStatus: "pending" | "paid" | "confirmed") => {
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      if (response.ok) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      }
    } catch (error) {
      console.error("[v0] Erro ao atualizar status:", error)
    }
  }

  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus)

  const totalRevenue = orders.reduce((sum, o) => (o.status === "confirmed" ? sum + o.total : sum), 0)
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kairos Admin</h1>
            <p className="text-gray-600 text-sm mt-1">Gerenciamento de Pedidos</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="gap-2 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
                Voltar para loja
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total de Pedidos</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Pedidos Confirmados</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{confirmedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Receita Total</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">R$ {totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(["all", "pending", "paid", "confirmed"] as const).map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? "default" : "outline"}
              className={filterStatus === status ? "bg-blue-600" : ""}
            >
              {status === "all"
                ? "Todos"
                : status === "pending"
                  ? "Pendentes"
                  : status === "paid"
                    ? "Pagos"
                    : "Confirmados"}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Nenhum pedido encontrado</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-lg shadow p-6 cursor-pointer transition ${
                    selectedOrder?.id === order.id ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{order.clientName}</p>
                      <p className="text-sm text-gray-600">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">R$ {order.total.toFixed(2)}</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                          order.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "paid"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status === "confirmed" ? "Confirmado" : order.status === "paid" ? "Pago" : "Pendente"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>

          {selectedOrder && (
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detalhes do Pedido</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Pedido ID</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.clientName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.phone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">CPF</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.cpf}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.state} {selectedOrder.zipCode}
                  </p>
                </div>

                {selectedOrder.observations && (
                  <div>
                    <p className="text-sm text-gray-600">Observações</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.observations}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Itens</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-900">R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Alterar Status</p>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="confirmed">Confirmado</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
