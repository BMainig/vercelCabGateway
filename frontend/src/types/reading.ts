export type PurchaseOrderItem = {
  id: number
  centro: string
  deposito: string
  material_number: string
  expected_quantity: number
  criado_por: string | null
  serial_range: string | null
  item: string
  status: string
  created_at: string
  updated_at: string | null
}

export type PendingReadingsResponse = {
  success: boolean
  data: PurchaseOrderItem[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}
