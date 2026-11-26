import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, isApiError } from '@/lib/api'
import type { LoginInput, RegisterInput, User } from './types'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/** Usuário logado, ou null se não houver sessão. */
async function fetchMe(): Promise<User | null> {
  try {
    return await api<User>('/auth/me')
  } catch (error) {
    if (isApiError(error, 401)) return null
    throw error
  }
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api<User>('/auth/login', { method: 'POST', body: input }),
    onSuccess: (user) => {
      // Começa "do zero" com o novo usuário (nada em cache de outra sessão)
      queryClient.clear()
      queryClient.setQueryData(authKeys.me, user)
    },
  })
}

/** Cadastro com código de convite; a pessoa já sai logada. */
export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api<User>('/auth/register', { method: 'POST', body: input }),
    onSuccess: (user) => {
      queryClient.clear()
      queryClient.setQueryData(authKeys.me, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      // Mesmo se a chamada falhar, limpa os dados locais do usuário
      queryClient.clear()
      queryClient.setQueryData(authKeys.me, null)
    },
  })
}
