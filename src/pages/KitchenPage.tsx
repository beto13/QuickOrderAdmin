import { useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import { getActiveOrders, updateOrderStatus } from '../api/orders'
import type { OrderDto } from '../types'

const COLUMNS = [
  { status: 'Pending',       label: 'Pendientes',      color: 'border-amber-400',  text: 'text-amber-400' },
  { status: 'InPreparation', label: 'En preparación',  color: 'border-blue-400',   text: 'text-blue-400'  },
  { status: 'Ready',         label: 'Listos',           color: 'border-green-400',  text: 'text-green-400' },
]

const NEXT_STATUS: Record<string, string> = {
  Pending: 'InPreparation',
  InPreparation: 'Ready',
  Ready: 'Delivered',
}

const NEXT_LABEL: Record<string, string> = {
  Pending: 'Tomar pedido',
  InPreparation: 'Marcar listo',
  Ready: 'Entregar',
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  return `${Math.floor(diff / 3600)}h`
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Record<number, OrderDto>>({})
  const [connected, setConnected] = useState(false)
  const hubRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    getActiveOrders().then(list => {
      const map: Record<number, OrderDto> = {}
      list.forEach(o => { map[o.id] = o })
      setOrders(map)
    })

    const hub = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/orders')
      .withAutomaticReconnect()
      .build()

    hub.on('NewOrder', (order: OrderDto) => {
      setOrders(prev => ({ ...prev, [order.id]: order }))
    })

    hub.on('OrderStatusChanged', ({ orderId, status }: { orderId: number; status: string }) => {
      setOrders(prev => {
        if (!prev[orderId]) return prev
        const updated = { ...prev[orderId], status }
        // Remover si ya no está en las columnas activas
        if (!COLUMNS.find(c => c.status === status)) {
          const next = { ...prev }
          delete next[orderId]
          return next
        }
        return { ...prev, [orderId]: updated }
      })
    })

    hub.onreconnecting(() => setConnected(false))
    hub.onreconnected(() => setConnected(true))
    hub.onclose(() => setConnected(false))

    hub.start().then(() => setConnected(true))
    hubRef.current = hub

    return () => { hub.stop() }
  }, [])

  const advance = async (order: OrderDto) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    await updateOrderStatus(order.id, next)
  }

  const cancel = async (order: OrderDto) => {
    await updateOrderStatus(order.id, 'Cancelled')
  }

  const columnOrders = (status: string) =>
    Object.values(orders)
      .filter(o => o.status === status)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Tablero de cocina</h1>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className="text-xs text-gray-500">{connected ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {COLUMNS.map(col => (
          <div key={col.status} className="flex flex-col min-h-0">
            {/* Column header */}
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${col.color}`}>
              <h2 className={`text-xs font-bold uppercase tracking-widest ${col.text}`}>{col.label}</h2>
              <span className="ml-auto text-xs bg-gray-800 text-gray-400 rounded-full px-2 py-0.5">
                {columnOrders(col.status).length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
              {columnOrders(col.status).length === 0 && (
                <p className="text-xs text-gray-600 text-center mt-8">Sin pedidos</p>
              )}
              {columnOrders(col.status).map(order => (
                <div key={order.id} className={`bg-gray-800 rounded-xl p-4 border-l-4 ${col.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold text-sm">Mesa {order.tableNumber}</span>
                    <span className="text-gray-500 text-xs">#{order.id} · {timeAgo(order.createdAt)}</span>
                  </div>

                  <ul className="space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-amber-400 font-bold w-5">{item.quantity}x</span>
                        <span className="text-gray-200">{item.productName}</span>
                        {item.notes && <span className="text-gray-500 italic text-xs">({item.notes})</span>}
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <p className="text-gray-500 text-xs italic mb-3">📝 {order.notes}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => cancel(order)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
                    >
                      Cancelar
                    </button>
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={() => advance(order)}
                        className="ml-auto text-xs bg-white text-gray-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {NEXT_LABEL[order.status]}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
