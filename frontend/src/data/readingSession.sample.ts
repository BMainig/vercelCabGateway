import type { ReadingItem, ReadingSessionSummary } from '../types/itemReading'

/** Dados de exemplo para a tela de leitura até existir endpoint no backend. */
export const READING_SESSION_SUMMARY: ReadingSessionSummary = {
  itemsRead: 40,
  itemsTotal: 67,
  ordersRead: 5,
}

export const READING_SESSION_ITEMS: ReadingItem[] = [
  { id: 'ABC000015', orderId: '4300002655', message: 'OK', status: 'ok' },
  { id: 'ABC000014', orderId: '4300002655', message: 'OK', status: 'ok' },
  { id: 'ABC000013', orderId: '4300002841', message: 'OK', status: 'ok' },
  { id: 'ABC000012', orderId: '4300002841', message: 'OK', status: 'ok' },
  { id: 'ABC000011', orderId: '4300002838', message: 'OK', status: 'ok' },
  { id: 'ABC000010', orderId: '4300002838', message: 'OK', status: 'ok' },
  { id: 'ABC000009', orderId: '4300002839', message: 'OK', status: 'ok' },
  { id: 'ABC000008', orderId: '4300002839', message: 'OK', status: 'ok' },
  { id: 'ABC000007', orderId: '4300002840', message: 'OK', status: 'ok' },
  { id: 'ABC000006', orderId: '4300002840', message: 'OK', status: 'ok' },
  { id: 'ABC000005', orderId: '4300002655', message: 'OK', status: 'ok' },
  { id: 'ABC000004', orderId: '4300002841', message: 'OK', status: 'ok' },
  { id: 'ABC000003', orderId: '4300002838', message: 'OK', status: 'ok' },
  { id: 'ABC000002', orderId: '4300002839', message: 'OK', status: 'ok' },
  {
    id: 'ABC000001',
    orderId: '4300002840',
    message: 'ITEM LIDO ANTERIORMENTE',
    status: 'error',
  },
]
