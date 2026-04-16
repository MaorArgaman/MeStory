import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

/**
 * Shared query keys so mutations can invalidate the right caches.
 * Keep this as the single source of truth to avoid typo-drift.
 */
export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...bookKeys.lists(), filters] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
  public: (filters?: Record<string, any>) => [...bookKeys.all, 'public', filters] as const,
};

interface ListBooksParams {
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: string;
  genre?: string;
  limit?: number;
}

/**
 * List the current user's books.
 * Results stay cached for 5 minutes (see queryClient defaults), so navigating
 * back to the dashboard does not re-hit the API.
 */
export function useMyBooks(params: ListBooksParams = {}) {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: async () => {
      const res = await api.get('/books', { params });
      return res.data.data;
    },
  });
}

/**
 * Fetch a single book by id. Used by the editor, design studio, publishing page…
 * All of them hit the same cache entry.
 */
export function useBook(bookId: string | null | undefined) {
  return useQuery({
    queryKey: bookId ? bookKeys.detail(bookId) : ['books', 'detail', 'none'],
    enabled: !!bookId,
    queryFn: async () => {
      const res = await api.get(`/books/${bookId}`);
      return res.data.data;
    },
  });
}

/**
 * Public marketplace listing. Cached separately from user-owned books.
 */
export function usePublicBooks(params: { search?: string; genre?: string; sortBy?: string; order?: 'asc' | 'desc' } = {}) {
  return useQuery({
    queryKey: bookKeys.public(params),
    queryFn: async () => {
      const res = await api.get('/books/public', { params });
      return res.data.data;
    },
  });
}

/**
 * Update a book and automatically invalidate the affected cache entries.
 */
export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await api.put(`/books/${id}`, updates);
      return res.data.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: bookKeys.detail(id) });
      qc.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}
