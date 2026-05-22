import { clearAuthToken } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken')
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearAuthToken()
    window.location.assign('/')
    throw new ApiError('Sessao expirada. Faca login novamente.', 401)
  }

  return response
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options)
  const data = (await response.json()) as ApiEnvelope<T> & T

  if (!response.ok || (typeof data === 'object' && data !== null && 'success' in data && !data.success)) {
    const message =
      (typeof data === 'object' && data !== null && 'message' in data && data.message) ||
      'Erro na requisicao.'
    throw new ApiError(String(message), response.status)
  }

  return data as T
}
