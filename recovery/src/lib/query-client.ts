import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        // Permission / validation errors will not succeed on retry.
        const code = (error as { code?: string }).code
        if (code && ['42501', 'PGRST301', '28000', 'P0001', 'P0002'].includes(code)) return false
        return failureCount < 2
      },
    },
  },
})
