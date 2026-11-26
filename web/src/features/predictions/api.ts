import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import { toaster } from '@/components/ui/toaster'
import { settingsKeys } from '@/features/settings/api'
import { api, isApiError } from '@/lib/api'
import type { Category, GroupPrediction, PredictionResponse, UpsertPredictionInput } from './types'

export const categoryKeys = {
  all: ['categories'] as const,
}

export const groupPredictionKeys = {
  all: ['predictions', 'all'] as const,
}

/** Palpites de todos (a API só libera depois do bloqueio). */
export function useGroupPredictions(options: { enabled: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: groupPredictionKeys.all,
    queryFn: () => api<GroupPrediction[]>('/predictions'),
    enabled: options.enabled,
    refetchInterval: options.refetchInterval,
  })
}

const upsertKey = ['predictions', 'upsert'] as const

export function useCategories(options: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => api<Category[]>('/categories'),
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Salva o palpite com atualização otimista: a escolha aparece marcada
 * na hora; se a API recusar, a tela volta ao estado real e mostra o erro.
 */
export function useUpsertPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: upsertKey,
    // Executa um salvamento por vez, na ordem dos toques
    // (evita que um palpite antigo sobrescreva um mais novo)
    scope: { id: 'predictions' },
    mutationFn: ({ categoryId, nomineeId }: UpsertPredictionInput) =>
      api<PredictionResponse>(`/predictions/${categoryId}`, {
        method: 'PUT',
        body: { nomineeId },
      }),
    onMutate: async ({ categoryId, nomineeId }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all })
      queryClient.setQueryData<Category[]>(categoryKeys.all, (old) =>
        old?.map((c) => (c.id === categoryId ? { ...c, myNomineeId: nomineeId } : c)),
      )
    },
    onError: (error) => {
      // Volta para o que está salvo de verdade
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      // 403 = palpites encerrados: atualiza o estado de bloqueio na tela
      if (isApiError(error, 403)) {
        void queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      }
      toaster.create({
        type: 'error',
        title: 'Palpite não salvo',
        description: error.message,
      })
    },
    onSettled: () => {
      // Progresso de preenchimento exibido no ranking
      void queryClient.invalidateQueries({ queryKey: ['predictions', 'progress'] })
    },
  })
}

/** IDs das categorias com salvamento em andamento (para mostrar "Salvando..."). */
export function useSavingCategoryIds(): Set<string> {
  const ids = useMutationState({
    filters: { mutationKey: upsertKey, status: 'pending' },
    select: (mutation) => (mutation.state.variables as UpsertPredictionInput).categoryId,
  })
  return new Set(ids)
}
