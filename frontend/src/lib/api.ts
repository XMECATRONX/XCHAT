/**
 * API client for making requests to the backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

interface ApiOptions extends RequestInit {
  params?: Record<string, string>
}

let nxcodeModule: typeof import('@nxcode/sdk') | null = null

async function getAuthToken() {
  if (typeof window === 'undefined') return null
  if (!nxcodeModule) {
    nxcodeModule = await import('@nxcode/sdk')
  }
  return nxcodeModule.default.auth.getToken()
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...init } = options

  let url = `${API_BASE}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers
  }

  // Add auth token if available (client-side only)
  const token = await getAuthToken()
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...init,
    headers
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(response.status, response.statusText, data)
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' })
}

export { ApiError }
