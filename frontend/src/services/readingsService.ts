import type { Order, OrderItem, OrderStatus } from '../types/order'
import type { PendingReadingsResponse, PurchaseOrderItem } from '../types/reading'
import { apiJson } from './apiClient'

function mapItemStatus(status: string): OrderItem['status'] {
  if (status === 'complete' || status === 'accepted') {
    return 'Recebido'
  }
  return 'Pendente'
}

function mapOrderStatus(items: PurchaseOrderItem[]): OrderStatus {
  const received = items.filter(
    (item) => item.status === 'complete' || item.status === 'accepted',
  ).length

  if (received <= 0) return 'Pendente'
  if (received >= items.length) return 'Completo'
  return 'Incompleto'
}

function mapItemToOrderItem(row: PurchaseOrderItem): OrderItem {
  return {
    id: row.item,
    status: mapItemStatus(row.status),
    material: row.material_number,
    readDate: null,
    operator: row.criado_por,
  }
}

export function mapItemsToOrders(items: PurchaseOrderItem[]): Order[] {
  const groups = new Map<string, PurchaseOrderItem[]>()

  for (const item of items) {
    const key = item.centro
    const group = groups.get(key)

    if (group) {
      group.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  return Array.from(groups.entries()).map(([centro, groupItems]) => {
    const orderItems = groupItems.map(mapItemToOrderItem)
    const lidosRead = orderItems.filter((item) => item.status === 'Recebido').length
    const lidosTotal = groupItems.reduce((sum, item) => sum + item.expected_quantity, 0)

    return {
      id: centro,
      lidosRead,
      lidosTotal: Math.max(lidosTotal, orderItems.length),
      status: mapOrderStatus(groupItems),
      items: orderItems,
    }
  })
}

export async function fetchPendingOrders(params?: {
  q?: string
  limit?: number
  offset?: number
}): Promise<Order[]> {
  const search = new URLSearchParams()

  if (params?.q) search.set('q', params.q)
  if (params?.limit) search.set('limit', String(params.limit))
  if (params?.offset) search.set('offset', String(params.offset))

  const query = search.toString()
  const path = `/api/readings/pending${query ? `?${query}` : ''}`

  const response = await apiJson<PendingReadingsResponse>(path)
  return mapItemsToOrders(response.data)
}
