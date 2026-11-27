import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Espelha GET /api/leaderboard
export interface LeaderboardRow {
  rank: number
  userId: string
  name: string
  points: number
  hits: number
  gotyHit: boolean
  filled: number
}

export interface Leaderboard {
  totalCategories: number
  decidedCategories: number
  gotyDecided: boolean
  players: LeaderboardRow[]
}

// Espelha GET /api/predictions/progress
export interface PlayerProgress {
  userId: string
  name: string
  filled: number
  total: number
}

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  progress: ['predictions', 'progress'] as const,
}

export function useLeaderboard(options: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: leaderboardKeys.all,
    queryFn: () => api<Leaderboard>('/leaderboard'),
    refetchInterval: options.refetchInterval,
  })
}

export function useProgress(options: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: leaderboardKeys.progress,
    queryFn: () => api<PlayerProgress[]>('/predictions/progress'),
    refetchInterval: options.refetchInterval,
  })
}
