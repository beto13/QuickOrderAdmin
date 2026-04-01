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

export interface OrderItemDto {
  menuProductId: number
  productName: string
  quantity: number
  unitPrice: number
  notes: string | null
}

export interface OrderDto {
  id: number
  tableId: number
  tableNumber: string
  menuId: number
  menuName: string
  status: string
  notes: string | null
  createdAt: string
  items: OrderItemDto[]
}

export interface TableDto {
  id: number
  number: string
  isActive: boolean
  menuId: number
}
