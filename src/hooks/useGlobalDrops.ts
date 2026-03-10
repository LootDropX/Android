import { useQuery } from '@tanstack/react-query';
import { fetchGlobalDrops } from '../services/drops.service';
import type { Drop } from '../types/drop.types';

export interface UseGlobalDropsReturn {
  drops: Drop[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches globally available drops for discovery from the map screen.
 */
export function useGlobalDrops(): UseGlobalDropsReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['global-drops'],
    queryFn: () => fetchGlobalDrops(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return {
    drops: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
