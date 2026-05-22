export type ReadingMessageStatus = 'ok' | 'error'

export type ReadingItem = {
  id: string
  orderId: string
  message: string
  status: ReadingMessageStatus
}

export type ReadingSessionSummary = {
  itemsRead: number
  itemsTotal: number
  ordersRead: number
}
