import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { ItemReadingPage } from '../pages/ItemReadingPage'
import { OrderDetailsPage } from '../pages/OrderDetailsPage'
import { LoginPage } from '../pages/LoginPage'
import { hasAuthToken } from '../services/authService'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={hasAuthToken() ? <Navigate to="/home" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/home/leitura" element={<ItemReadingPage />} />
        <Route path="/home/pedido/:orderId" element={<OrderDetailsPage />} />
      </Route>
    </Routes>
  )
}
