import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient for the whole app.
 *
 * Defaults are tuned for a "mostly-read, occasionally-mutate" app:
 *   - 5-minute staleTime so the dashboard doesn't refetch on every tab switch
 *   - Retry once on network errors; never retry 4xx responses
 *   - Don't refetch on window focus (too aggressive for this UX)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
