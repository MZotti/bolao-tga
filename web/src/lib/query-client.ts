import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/api'
import { isApiError } from './api'

/**
 * Se qualquer chamada responder 401 (sessão expirada ou usuário removido),
 * marca o usuário como deslogado. A tela reage sozinha, porque tudo que
 * depende de login lê a query `authKeys.me`.
 */
function handleUnauthorized(error: unknown) {
  if (isApiError(error, 401)) {
    queryClient.setQueryData(authKeys.me, null)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Erros 4xx (não autorizado, não encontrado...) não melhoram tentando de novo
      retry: (failureCount, error) =>
        !(isApiError(error) && error.status >= 400 && error.status < 500) && failureCount < 2,
    },
    mutations: {
      retry: false,
    },
  },
})
