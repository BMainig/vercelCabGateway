import type { Order } from '../types/order'
import { MOCK_ORDERS } from '../data/mockOrders'
import { ensureOrderItems } from '../utils/orderItems'

const USE_AUTH_MOCK = import.meta.env.VITE_USE_AUTH_MOCK !== 'false'

let orders: Order[] = USE_AUTH_MOCK
  ? MOCK_ORDERS.map((order) => ensureOrderItems(order))
  : []

export function setOrders(nextOrders: Order[]): void {
  orders = nextOrders.map((order) => ensureOrderItems(order))
}

export function getOrders(): Order[] {
  return orders
}

export function getOrderById(orderId: string): Order | undefined {
  return orders.find((order) => order.id === orderId)
}
