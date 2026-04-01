import client from './client'
import type { ApiResponse, PaginatedResponse, MenuDto } from '../types'

export async function getMenus(page = 1): Promise<PaginatedResponse<MenuDto>> {
  const res = await client.get<ApiResponse<PaginatedResponse<MenuDto>>>(`/menus?pageNumber=${page}&pageSize=50`)
  return res.data.data
}

export async function createMenu(name: string): Promise<MenuDto> {
  const res = await client.post<ApiResponse<MenuDto>>('/menus', { name })
  return res.data.data
}

export async function updateMenu(id: number, name: string, isActive: boolean): Promise<MenuDto> {
  const res = await client.put<ApiResponse<MenuDto>>(`/menus/${id}`, { name, isActive })
  return res.data.data
}

export async function deleteMenu(id: number): Promise<void> {
  await client.delete(`/menus/${id}`)
}
