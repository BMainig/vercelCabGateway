import type { LoginResponse } from '../types/auth'

const AUTH_TOKEN_KEY = 'authToken'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const LOGIN_URL = `${API_BASE_URL}/api/auth/login`
const USE_AUTH_MOCK = import.meta.env.VITE_USE_AUTH_MOCK === 'true'

function buildMockLogin(username: string, password: string): LoginResponse {
  if (username !== 'admin' || password !== 'admin123') {
    throw new Error('Usuario ou senha invalidos.')
  }

  return {
    success: true,
    message: 'Login realizado com sucesso.',
    token: 'mock-token-cabgateway',
    user: {
      user_id: 1,
      username: 'admin',
      user_first_name: 'Admin',
      user_last_name: 'CabGateway',
      user_mail: 'admin@cabgateway.local',
    },
  }
}

export async function loginWithBasicAuth(
  username: string,
  password: string,
): Promise<LoginResponse> {
  if (USE_AUTH_MOCK) {
    const mockData = buildMockLogin(username, password)
    localStorage.setItem(AUTH_TOKEN_KEY, mockData.token as string)
    return mockData
  }

  const auth = btoa(`${username}:${password}`)
  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })

  const data = (await response.json()) as LoginResponse

  if (!response.ok || !data.success || !data.token) {
    throw new Error(data.message || 'Nao foi possivel realizar o login.')
  }

  localStorage.setItem(AUTH_TOKEN_KEY, data.token)
  return data
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function hasAuthToken(): boolean {
  return Boolean(getAuthToken())
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
