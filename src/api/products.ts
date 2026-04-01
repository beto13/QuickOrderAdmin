import client from './client'
import type { ApiResponse, PaginatedResponse, ProductDto } from '../types'

export async function getProducts(page = 1): Promise<PaginatedResponse<ProductDto>> {
  const res = await client.get<ApiResponse<PaginatedResponse<ProductDto>>>(`/products?pageNumber=${page}&pageSize=20`)
  return res.data.data
}

export async function createProduct(name: string, description: string | null): Promise<ProductDto> {
  const res = await client.post<ApiResponse<ProductDto>>('/products', { name, description })
  return res.data.data
}

export async function updateProduct(id: number, name: string, description: string | null): Promise<ProductDto> {
  const res = await client.put<ApiResponse<ProductDto>>(`/products/${id}`, { name, description })
  return res.data.data
}

export async function deleteProduct(id: number): Promise<void> {
  await client.delete(`/products/${id}`)
}

export async function uploadProductImage(id: number, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await client.post<ApiResponse<string>>(`/products/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}
