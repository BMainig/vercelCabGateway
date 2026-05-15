import type { Order, OrderItem } from '../types/order'

function createItem(
  index: number,
  received: boolean,
  readDate = '30/03/2026',
  operator = 'marlon.teixeira',
): OrderItem {
  return {
    id: `ABC${String(index + 1).padStart(6, '0')}`,
    status: received ? 'Recebido' : 'Pendente',
    material: String(6460 + index),
    readDate: received ? readDate : null,
    operator: received ? operator : null,
  }
}

export function buildDefaultItems(
  lidosRead: number,
  lidosTotal: number,
): OrderItem[] {
  const total = Math.max(lidosTotal, 1)

  return Array.from({ length: total }, (_, index) =>
    createItem(index, index < lidosRead),
  )
}

export function buildMockItemsForOrder4300002838(): OrderItem[] {
  const items: OrderItem[] = []

  for (let number = 15; number >= 1; number -= 1) {
    const index = number - 1
    const received = number >= 6
    items.push(createItem(index, received))
  }

  return items
}

export function ensureOrderItems(order: Order): Order {
  if (order.items.length > 0) {
    return order
  }

  const items =
    order.id === '4300002838'
      ? buildMockItemsForOrder4300002838()
      : buildDefaultItems(order.lidosRead, order.lidosTotal)

  const lidosRead = items.filter((item) => item.status === 'Recebido').length

  return {
    ...order,
    items,
    lidosRead,
    lidosTotal: items.length,
    status:
      lidosRead <= 0
        ? 'Pendente'
        : lidosRead >= items.length
          ? 'Completo'
          : 'Incompleto',
  }
}

export function getOrderSummaryLabel(order: Order): string {
  const received = order.items.filter((item) => item.status === 'Recebido').length
  return `${received}/${order.items.length}`
}
