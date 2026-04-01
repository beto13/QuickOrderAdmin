import client from './client'
import type { ApiResponse, OrderDto } from '../types'

export async function getActiveOrders(): Promise<OrderDto[]> {
  const res = await client.get<ApiResponse<OrderDto[]>>('/orders/active')
  return res.data.data
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  await client.patch(`/orders/${orderId}/status`, { status })
}
