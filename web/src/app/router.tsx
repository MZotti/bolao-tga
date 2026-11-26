import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminPage } from '@/features/admin/AdminPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { RankingPage } from '@/features/leaderboard/RankingPage'
import { GroupPredictionsPage } from '@/features/predictions/GroupPredictionsPage'
import { PredictionsPage } from '@/features/predictions/PredictionsPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      // Aceita ?convite=CODIGO para preencher o código automaticamente
      { path: 'cadastro', element: <RegisterPage /> },
      {
        path: 'palpites',
        // Só players fazem palpites (a API recusa palpites do admin)
        element: (
          <RequireAuth role="PLAYER">
            <PredictionsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'ranking',
        element: (
          <RequireAuth>
            <RankingPage />
          </RequireAuth>
        ),
      },
      {
        path: 'galera',
        element: (
          <RequireAuth>
            <GroupPredictionsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireAuth role="ADMIN">
            <AdminPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
