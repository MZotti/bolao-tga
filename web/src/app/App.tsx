import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router/dom'
import { Provider as ChakraProvider } from '@/components/ui/provider'
import { Toaster } from '@/components/ui/toaster'
import { queryClient } from '@/lib/query-client'
import { router } from './router'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Visual do TGA é escuro: tema escuro fixo */}
      <ChakraProvider forcedTheme="dark">
        <RouterProvider router={router} />
        <Toaster />
      </ChakraProvider>
      {/* Só aparece em desenvolvimento (removido automaticamente do build de produção) */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
