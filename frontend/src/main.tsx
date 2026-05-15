import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('reset') === '1') {
  localStorage.removeItem('authToken')
  window.history.replaceState({}, '', window.location.pathname || '/')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
