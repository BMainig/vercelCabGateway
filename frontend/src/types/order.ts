export type OrderStatus = 'Pendente' | 'Incompleto' | 'Completo'

export type OrderItemStatus = 'Pendente' | 'Recebido'

export type OrderItem = {
  id: string
  status: OrderItemStatus
  material: string
  readDate: string | null
  operator: string | null
}

export type Order = {
  id: string
  lidosRead: number
  lidosTotal: number
  status: OrderStatus
  items: OrderItem[]
}
