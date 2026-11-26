import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { categoryKeys } from '@/features/predictions/api'
import { settingsKeys, useSettings } from './api'

/**
 * Contagem regressiva até o bloqueio dos palpites.
 *
 * Usa o relógio do SERVIDOR (serverTime) como referência, para não depender
 * do relógio do celular de cada participante. Quando chega a zero, recarrega
 * settings e categorias para refletir o bloqueio decidido pela API.
 */
export function useLockCountdown() {
  const { data, dataUpdatedAt, isPending } = useSettings()
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())

  const lockAtMs = data?.predictionsLockAt ? Date.parse(data.predictionsLockAt) : null
  // Diferença entre o relógio do servidor e o do aparelho
  const offsetMs = data ? Date.parse(data.serverTime) - dataUpdatedAt : 0

  useEffect(() => {
    if (lockAtMs === null || data?.locked) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [lockAtMs, data?.locked])

  const remainingMs = lockAtMs === null ? null : Math.max(0, lockAtMs - (now + offsetMs))
  const expired = remainingMs === 0
  const serverLocked = data?.locked ?? false

  useEffect(() => {
    if (expired && !serverLocked) {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    }
  }, [expired, serverLocked, queryClient])

  return {
    isPending,
    lockAt: lockAtMs === null ? null : new Date(lockAtMs),
    remainingMs,
    locked: serverLocked || expired,
  }
}

/** "3d 04:22:10" ou "04:22:10" */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return days > 0 ? `${days}d ${clock}` : clock
}
