import client from './client'
import type { ApiResponse, PaginatedResponse, TableDto } from '../types'

export async function getTables(page = 1): Promise<PaginatedResponse<TableDto>> {
  const res = await client.get<ApiResponse<PaginatedResponse<TableDto>>>(`/tables?pageNumber=${page}&pageSize=50`)
  return res.data.data
}

export async function createTable(number: string, menuId: number): Promise<TableDto> {
  const res = await client.post<ApiResponse<TableDto>>('/tables', { number, menuId })
  return res.data.data
}

export async function updateTable(id: number, number: string, isActive: boolean, menuId: number): Promise<TableDto> {
  const res = await client.put<ApiResponse<TableDto>>(`/tables/${id}`, { number, isActive, menuId })
  return res.data.data
}

export async function deleteTable(id: number): Promise<void> {
  await client.delete(`/tables/${id}`)
}
