import client from './client'
import type { ApiResponse, PaginatedResponse, ModifierGroupDto, ModifierDto } from '../types'

// Modifier Groups
export async function getModifierGroups(page = 1): Promise<PaginatedResponse<ModifierGroupDto>> {
  const res = await client.get<ApiResponse<PaginatedResponse<ModifierGroupDto>>>(`/modifiergroups?pageNumber=${page}&pageSize=50`)
  return res.data.data
}

export async function createModifierGroup(
  name: string,
  minSelections: number,
  maxSelections: number,
  isRequired: boolean,
  productId: number | null,
  categoryId: number | null,
): Promise<ModifierGroupDto> {
  const res = await client.post<ApiResponse<ModifierGroupDto>>('/modifiergroups', {
    name, minSelections, maxSelections, isRequired, productId, categoryId,
  })
  return res.data.data
}

export async function updateModifierGroup(
  id: number,
  name: string,
  minSelections: number,
  maxSelections: number,
  isRequired: boolean,
): Promise<ModifierGroupDto> {
  const res = await client.put<ApiResponse<ModifierGroupDto>>(`/modifiergroups/${id}`, {
    name, minSelections, maxSelections, isRequired,
  })
  return res.data.data
}

export async function deleteModifierGroup(id: number): Promise<void> {
  await client.delete(`/modifiergroups/${id}`)
}

// Modifiers (opciones dentro de un grupo)
export async function getModifiersByGroup(groupId: number): Promise<PaginatedResponse<ModifierDto>> {
  const res = await client.get<ApiResponse<PaginatedResponse<ModifierDto>>>(`/modifiers?modifierGroupId=${groupId}&pageSize=100`)
  return res.data.data
}

export async function createModifier(modifierGroupId: number, name: string, description: string | null): Promise<ModifierDto> {
  const res = await client.post<ApiResponse<ModifierDto>>('/modifiers', { modifierGroupId, name, description })
  return res.data.data
}

export async function updateModifier(id: number, name: string, description: string | null): Promise<ModifierDto> {
  const res = await client.put<ApiResponse<ModifierDto>>(`/modifiers/${id}`, { name, description })
  return res.data.data
}

export async function deleteModifier(id: number): Promise<void> {
  await client.delete(`/modifiers/${id}`)
}
