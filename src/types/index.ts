export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  totalPages: number
  pageNumber: number
  pageSize: number
}

export interface MenuDto {
  id: number
  name: string
  isActive: boolean
}

export interface ProductDto {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
}

export interface CategoryDto {
  id: number
  name: string
  displayOrder: number
}
