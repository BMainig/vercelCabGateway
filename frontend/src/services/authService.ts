import type { LoginResponse } from '../types/auth'

const AUTH_TOKEN_KEY = 'authToken'
const LOGIN_URL = 'http://localhost:3001/api/auth/login'
const USE_AUTH_MOCK = import.meta.env.VITE_USE_AUTH_MOCK === 'true' || import.meta.env.DEV

function buildMockLogin(username: string, password: string): LoginResponse {
  if (username !== 'admin' || password !== 'admin123') {
    throw new Error('Usuario ou senha invalidos no modo mock.')
  }

  return {
    success: true,
    message: 'Login realizado com sucesso (mock).',
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

export function hasAuthToken(): boolean {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
}
