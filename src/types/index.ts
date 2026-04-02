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

export interface TableDto {
  id: number
  number: string
  isActive: boolean
  menuId: number
}

export interface ModifierGroupDto {
  id: number
  name: string
  minSelections: number
  maxSelections: number
  isRequired: boolean
  productId: number | null
  categoryId: number | null
}

export interface ModifierDto {
  id: number
  modifierGroupId: number
  name: string
  description: string | null
}
