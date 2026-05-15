import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { getOrderById } from '../services/ordersStore'
import type { OrderItem } from '../types/order'

function formatDisplayDate(value: string | null): string {
  return value ?? '-'
}

function formatDisplayOperator(value: string | null): string {
  return value ?? '-'
}

export function OrderDetailsPage() {
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const order = orderId ? getOrderById(orderId) : undefined
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = useMemo(() => {
    if (!order) return []

    const query = searchQuery.trim().toLowerCase()
    if (!query) return order.items

    return order.items.filter((item: OrderItem) => {
      const keywords = [
        item.id,
        item.status,
        item.material,
        formatDisplayDate(item.readDate),
        formatDisplayOperator(item.operator),
      ]
        .join(' ')
        .toLowerCase()

      return keywords.includes(query)
    })
  }, [order, searchQuery])

  if (!order) {
    return (
      <div className="home-layout">
        <AppHeader />
        <main className="home-content">
          <p>Pedido nao encontrado.</p>
          <button type="button" className="back-btn" onClick={() => navigate('/home')}>
            voltar
          </button>
        </main>
      </div>
    )
  }

  const receivedCount = order.items.filter((item) => item.status === 'Recebido').length
  const summaryStatus = order.status.toUpperCase()

  return (
    <div className="home-layout">
      <AppHeader />

      <main className="home-content order-details-content">
        <div className="order-details-title-row">
          <button type="button" className="back-btn" onClick={() => navigate('/home')}>
            voltar
          </button>
          <h1>Detalhes do Pedido #{order.id}</h1>
        </div>

        <label className="home-search" htmlFor="item-search">
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            id="item-search"
            type="search"
            placeholder="Pesquisar"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="order-details-panel">
          <div className="order-summary-bar">
            <span>Pedido #{order.id}</span>
            <span>
              Itens: {receivedCount}/{order.items.length}
            </span>
            <span className="order-summary-status">
              Status:{' '}
              <strong
                className={
                  order.status === 'Incompleto'
                    ? 'order-summary-status-value order-summary-status-incompleto'
                    : 'order-summary-status-value'
                }
              >
                {summaryStatus}
              </strong>
            </span>
          </div>

          <div className="orders-table-wrapper order-details-table-wrapper">
            <table className="orders-table order-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Material</th>
                  <th>Data da leitura</th>
                  <th>Operador</th>
                </tr>
              </thead>
              <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="cell-strong">{item.id}</td>
                    <td>
                      <span
                        className={`item-status item-status-${item.status.toLowerCase()}`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="cell-strong">{item.material}</td>
                    <td className="cell-strong">{formatDisplayDate(item.readDate)}</td>
                    <td className="cell-strong">{formatDisplayOperator(item.operator)}</td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
