import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithBasicAuth } from '../services/authService'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      await loginWithBasicAuth(username, password)
      navigate('/home')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Erro de conexao com a API de autenticacao.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-badge">
          <img src="/cemig-logo.png" alt="CEMIG" className="brand-logo" />
        </div>

        <h1>Bem vindo!</h1>
        <p className="login-subtitle">Faca o login para prosseguir</p>

        <div className="input-wrapper">
          <span className="input-icon" aria-hidden="true">
            &#128100;
          </span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Usuário"
            autoComplete="username"
            required
          />
        </div>

        <div className="input-wrapper">
          <span className="input-icon" aria-hidden="true">
            &#128274;
          </span>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            autoComplete="current-password"
            required
          />
        </div>

        <a className="forgot-link" href="#">
          Esqueceu a senha?
        </a>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Login'}
        </button>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </form>
    </main>
  )
}
