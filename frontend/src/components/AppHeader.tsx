import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../services/authService'

export function AppHeader() {
  const navigate = useNavigate()
  const menuId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  const handleLogout = () => {
    closeMenu()
    clearAuthToken()
    navigate('/')
  }

  useEffect(() => {
    if (!isMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isMenuOpen])

  return (
    <header className="home-header">
      <div className="home-header-menu" ref={menuRef}>
        <button
          type="button"
          className="home-header-menu-trigger"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <span className="home-header-logo-badge">
            <img src="/cemig-logo.png" alt="CEMIG" className="home-header-logo" />
          </span>
        </button>

        {isMenuOpen && (
          <nav id={menuId} className="home-header-menu-panel" aria-label="Menu principal">
            <button type="button" className="home-header-menu-item" onClick={handleLogout}>
              Sair
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
