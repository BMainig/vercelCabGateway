import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { uploadCsv } from '../services/importService'
import { fetchPendingOrders } from '../services/readingsService'
import { getOrders, setOrders } from '../services/ordersStore'
import type { Order } from '../types/order'

const USE_AUTH_MOCK = import.meta.env.VITE_USE_AUTH_MOCK === 'true'

function syncOrders(nextOrders: Order[]): Order[] {
  setOrders(nextOrders)
  return nextOrders
}

export function HomePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [orders, setOrdersState] = useState<Order[]>(() => getOrders())
  const [searchQuery, setSearchQuery] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [isLoading, setIsLoading] = useState(!USE_AUTH_MOCK)
  const [loadError, setLoadError] = useState('')

  const loadOrders = useCallback(async (query?: string) => {
    if (USE_AUTH_MOCK) return

    setIsLoading(true)
    setLoadError('')

    try {
      const data = await fetchPendingOrders({
        q: query?.trim() || undefined,
        limit: 200,
      })
      setOrdersState(syncOrders(data))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel carregar os pedidos.'
      setLoadError(message)
      setOrdersState([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (USE_AUTH_MOCK) return

    const timeout = setTimeout(() => {
      void loadOrders(searchQuery)
    }, 300)

    return () => clearTimeout(timeout)
  }, [loadOrders, searchQuery])

  const filteredOrders = useMemo(() => {
    if (!USE_AUTH_MOCK) return orders

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

    setImportMessage('')

    try {
      if (USE_AUTH_MOCK) {
        setImportMessage('Importacao via API desativada no modo mock.')
        return
      }

      const result = await uploadCsv(file)
      await loadOrders(searchQuery)
      setImportMessage(
        `${result.imported_rows ?? 0} linha(s) importada(s) com sucesso.`,
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel importar o arquivo CSV.'
      setImportMessage(message)
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
            title="Importar CSV (formato SAP: centro;deposito;...)"
          >
            +
          </button>
          <h1>Pedidos pendentes</h1>
          <button
            type="button"
            className="start-receiving-btn"
            onClick={() => navigate('/home/leitura')}
          >
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
        {loadError && <p className="import-message">{loadError}</p>}
        {isLoading && <p className="import-message">Carregando pedidos...</p>}

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
              {filteredOrders.length === 0 && !isLoading ? (
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
