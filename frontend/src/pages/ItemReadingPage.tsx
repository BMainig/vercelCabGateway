import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ReadingItemsProgress } from '../components/ReadingItemsProgress'
import {
  READING_SESSION_ITEMS,
  READING_SESSION_SUMMARY,
} from '../data/readingSession.sample'

export function ItemReadingPage() {
  const navigate = useNavigate()
  const [sessionItems] = useState(READING_SESSION_ITEMS)
  const [itemsRead] = useState(READING_SESSION_SUMMARY.itemsRead)

  const itemsTotal = READING_SESSION_SUMMARY.itemsTotal
  const ordersRead = READING_SESSION_SUMMARY.ordersRead

  const handleFinishReading = () => {
    navigate('/home')
  }

  return (
    <div className="home-layout reading-layout">
      <AppHeader />

      <main className="home-content reading-content">
        <div className="reading-title-row">
          <h1>Leitura de Itens</h1>
          <button type="button" className="finish-reading-btn" onClick={handleFinishReading}>
            Finalizar Leitura
          </button>
        </div>

        <div className="reading-panel">
          <div className="reading-summary-bar order-summary-bar">
            <ReadingItemsProgress itemsRead={itemsRead} itemsTotal={itemsTotal} />
            <span className="reading-summary-orders">Pedidos lidos: {ordersRead}</span>
          </div>

          <div className="reading-table-wrapper">
            <table className="reading-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Pedido</th>
                  <th>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {sessionItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.orderId}</td>
                    <td>
                      <span
                        className={
                          item.status === 'ok'
                            ? 'reading-message reading-message-ok'
                            : 'reading-message reading-message-error'
                        }
                      >
                        {item.message}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
