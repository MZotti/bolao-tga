/**
 * Cliente HTTP da API do bolão.
 *
 * - Todas as rotas ficam em /api (em dev, o Vite faz proxy para o Nest;
 *   em produção, o Caddy encaminha). Front e API ficam na mesma origem,
 *   então o cookie de sessão é enviado automaticamente.
 * - Erros viram ApiError, com o status HTTP e a mensagem do backend.
 */

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: Method
  body?: unknown
  signal?: AbortSignal
}

// Formato de erro padrão do NestJS: { statusCode, message, error }
// (message vira um array quando a validação de DTO falha)
function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: unknown }
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
    if (typeof message === 'string') return message
  }
  if (status === 429) return 'Muitas tentativas. Aguarde um minuto e tente novamente.'
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.')
  }

  if (response.status === 204) return undefined as T

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(data, response.status), data)
  }
  return data as T
}

export const isApiError = (error: unknown, status?: number): error is ApiError =>
  error instanceof ApiError && (status === undefined || error.status === status)
