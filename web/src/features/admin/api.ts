import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toaster } from '@/components/ui/toaster'
import type { Role, User } from '@/features/auth/types'
import { leaderboardKeys } from '@/features/leaderboard/api'
import { categoryKeys } from '@/features/predictions/api'
import type { Category } from '@/features/predictions/types'
import { type Settings, settingsKeys } from '@/features/settings/api'
import { api } from '@/lib/api'

const notifyError = (title: string) => (error: Error) =>
  toaster.create({ type: 'error', title, description: error.message })

// ---------- Resultados ----------

interface WinnerResponse {
  id: string
  winnerNomineeId: string | null
}

/**
 * Marca ou desfaz o vencedor (nomineeId = null desfaz), com atualização
 * otimista: o botão muda na hora, mesmo com a cerimônia correndo rápido.
 */
export function useSetWinner() {
  const queryClient = useQueryClient()

  const setLocal = (categoryId: string, winnerNomineeId: string | null) =>
    queryClient.setQueryData<Category[]>(categoryKeys.all, (old) =>
      old?.map((c) => (c.id === categoryId ? { ...c, winnerNomineeId } : c)),
    )

  return useMutation({
    scope: { id: 'results' },
    mutationFn: ({ categoryId, nomineeId }: { categoryId: string; nomineeId: string | null }) =>
      nomineeId
        ? api<WinnerResponse>(`/results/${categoryId}`, { method: 'PUT', body: { nomineeId } })
        : api<WinnerResponse>(`/results/${categoryId}`, { method: 'DELETE' }),
    onMutate: async ({ categoryId, nomineeId }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all })
      setLocal(categoryId, nomineeId)
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      notifyError('Resultado não salvo')(error)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: leaderboardKeys.all })
    },
  })
}

// ---------- Bloqueio ----------

export function useUpdateLock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (predictionsLockAt: string | null) =>
      api<Settings>('/settings', { method: 'PATCH', body: { predictionsLockAt } }),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKeys.all, settings)
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: notifyError('Horário não alterado'),
  })
}

// ---------- Participantes ----------

export const userKeys = {
  all: ['users'] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => api<User[]>('/users'),
  })
}

/**
 * Define uma senha temporária para alguém (ex.: esqueceu a senha).
 * A API encerra as sessões da pessoa, e no próximo login ela escolhe uma nova.
 */
export function useResetPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api<User>(`/users/${userId}/password`, { method: 'PATCH', body: { password } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: Role
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => api<User>('/users', { method: 'POST', body: input }),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
      void queryClient.invalidateQueries({ queryKey: leaderboardKeys.progress })
      toaster.create({ type: 'success', title: `${user.name} cadastrado(a)` })
    },
  })
}
