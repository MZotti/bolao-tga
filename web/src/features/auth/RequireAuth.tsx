import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useMe } from './api'
import type { Role } from './types'

interface RequireAuthProps {
  children: ReactNode
  /** Se informado, exige também essa role (ex.: 'ADMIN'). */
  role?: Role
}

/**
 * Protege uma rota: sem login, manda para /login (e volta depois);
 * com role errada, manda para a tela inicial.
 */
export function RequireAuth({ children, role }: RequireAuthProps) {
  const { data: user, isPending } = useMe()
  const location = useLocation()

  if (isPending) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (role && user.role !== role) return <Navigate to="/" replace />

  return children
}
