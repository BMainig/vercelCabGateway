import { Navigate, Outlet } from 'react-router-dom'
import { hasAuthToken } from '../services/authService'

export function ProtectedRoute() {
  if (!hasAuthToken()) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
