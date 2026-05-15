import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { getOrders, setOrders } from '../services/ordersStore'
import type { Order } from '../types/order'
import { ensureOrderItems } from '../utils/orderItems'
import { parseOrdersFromCsv } from '../utils/csvImport'

const SAMPLE_ORDERS: Order[] = [
  ensureOrderItems({
    id: '4300002838',
    lidosRead: 10,
    lidosTotal: 15,
    status: 'Incompleto',
    items: [],
  }),
  ensureOrderItems({
    id: '4300002839',
    lidosRead: 0,
    lidosTotal: 214,
    status: 'Pendente',
    items: [],
  }),
  ensureOrderItems({
    id: '4300002840',
    lidosRead: 120,
    lidosTotal: 120,
    status: 'Completo',
    items: [],
  }),
  ensureOrderItems({
    id: '4300002841',
    lidosRead: 15,
    lidosTotal: 90,
    status: 'Incompleto',
    items: [],
  }),
  ensureOrderItems({
    id: '4300002842',
    lidosRead: 0,
    lidosTotal: 52,
    status: 'Pendente',
    items: [],
  }),
]

function syncOrders(nextOrders: Order[]): Order[] {
  const prepared = nextOrders.map((order) => ensureOrderItems(order))
  setOrders(prepared)
  return prepared
}

export function HomePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [orders, setOrdersState] = useState<Order[]>(() => {
    const stored = getOrders()
    return stored.length > 0 ? stored : syncOrders(SAMPLE_ORDERS)
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [importMessage, setImportMessage] = useState('')

  useEffect(() => {
    setOrders(orders)
  }, [orders])

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return orders

    return orders.filter((order) => {
      const lidosLabel = `${order.lidosRead}/${order.lidosTotal}`
      const keywords = [order.id, lidosLabel, order.status].join(' ').toLowerCase()
      return keywords.includes(query)
    })
  }, [orders, searchQuery])

  const handleImportCsvClick = () => {
    fileInputRef.current?.click()
  }

  const handleOrderClick = (orderId: string) => {
    navigate(`/home/pedido/${orderId}`)
  }

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    try {
      const content = await file.text()
      const importedOrders = parseOrdersFromCsv(content)

      if (importedOrders.length === 0) {
        setImportMessage('Nenhum pedido valido encontrado no CSV.')
        return
      }

      setOrdersState(syncOrders(importedOrders))
      setImportMessage(`${importedOrders.length} pedido(s) importado(s) com sucesso.`)
    } catch {
      setImportMessage('Nao foi possivel importar o arquivo CSV.')
    }
  }

  return (
    <div className="home-layout">
      <AppHeader />

      <main className="home-content">
        <div className="home-title-row">
          <button
            type="button"
            className="import-csv-btn"
            onClick={handleImportCsvClick}
            aria-label="Importar pedidos via CSV"
            title="Importar CSV"
          >
            +
          </button>
          <h1>Pedidos pendentes</h1>
          <button type="button" className="start-receiving-btn">
            <span>Iniciar recebimento</span>
            <span className="play-icon" aria-hidden="true">
              ▶
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="csv-input-hidden"
            onChange={handleCsvImport}
          />
        </div>

        <label className="home-search" htmlFor="order-search">
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            id="order-search"
            type="search"
            placeholder="Pesquisar"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        {importMessage && <p className="import-message">{importMessage}</p>}

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lidos</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-row">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <tr
                    key={`${order.id}-${index}`}
                    className={`order-row ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}
                    onClick={() => handleOrderClick(order.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleOrderClick(order.id)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Abrir detalhes do pedido ${order.id}`}
                  >
                    <td>{order.id}</td>
                    <td>
                      {order.lidosRead}/{order.lidosTotal}
                    </td>
                    <td>
                      <span className={`status-badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
