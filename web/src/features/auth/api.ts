import { hashKey, type Query, type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, isApiError } from '@/lib/api'
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput, User } from './types'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

const meHash = hashKey(authKeys.me)
const isNotMe = (query: Query) => query.queryHash !== meHash

/**
 * Troca de sessão (login, cadastro, logout): define o usuário atual e descarta
 * os dados da sessão anterior.
 *
 * Não usa queryClient.clear(): ele REMOVE as queries do cache, e componentes
 * que continuam montados (como o header) ficam presos à query antiga e não
 * veem a atualização. Por isso a query "me" é só atualizada, as queries em
 * uso são resetadas (os observers são avisados e buscam de novo) e as que não
 * estão em uso são removidas.
 */
function switchSession(queryClient: QueryClient, user: User | null) {
  queryClient.setQueryData(authKeys.me, user)
  queryClient.removeQueries({ predicate: isNotMe, type: 'inactive' })
  void queryClient.resetQueries({ predicate: isNotMe, type: 'active' })
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
    // Começa "do zero" com o novo usuário (nada em cache de outra sessão)
    onSuccess: (user) => switchSession(queryClient, user),
  })
}

/** Cadastro com código de convite; a pessoa já sai logada. */
export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api<User>('/auth/register', { method: 'POST', body: input }),
    onSuccess: (user) => switchSession(queryClient, user),
  })
}

/**
 * Troca a própria senha. A API renova o cookie (as outras sessões são
 * encerradas) e devolve o usuário já com mustChangePassword = false.
 */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api<User>('/auth/change-password', { method: 'POST', body: input }),
    // Mesmo usuário: só atualiza o "me" (sem descartar o resto do cache)
    onSuccess: (user) => queryClient.setQueryData(authKeys.me, user),
  })
}

/** Altera o próprio nome e e-mail. */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api<User>('/auth/me', { method: 'PATCH', body: input }),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user)
      // O nome aparece no ranking, nos palpites da galera e no painel do admin
      void queryClient.invalidateQueries({ predicate: isNotMe })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    // Mesmo se a chamada falhar, limpa os dados locais do usuário
    onSettled: () => switchSession(queryClient, null),
  })
}
