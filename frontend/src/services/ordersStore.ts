import type { Order } from '../types/order'
import { ensureOrderItems } from '../utils/orderItems'

let orders: Order[] = []

export function setOrders(nextOrders: Order[]): void {
  orders = nextOrders.map((order) => ensureOrderItems(order))
}

export function getOrders(): Order[] {
  return orders
}

export function getOrderById(orderId: string): Order | undefined {
  return orders.find((order) => order.id === orderId)
}
