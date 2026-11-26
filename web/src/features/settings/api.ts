import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Espelha GET /api/settings
export interface Settings {
  predictionsLockAt: string | null
  locked: boolean
  serverTime: string
}

export const settingsKeys = {
  all: ['settings'] as const,
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => api<Settings>('/settings'),
    // Se o admin mudar o horário, todo mundo fica sabendo em até 1 minuto
    refetchInterval: 60_000,
  })
}
