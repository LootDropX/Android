import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface LeaderboardEntry {
  walletAddress: string;
  totalClaims: number;
  rank: number;
}

export interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches the top claimers leaderboard from Supabase.
 * Aggregates claims by wallet address and ranks them by total count.
 *
 * @returns Leaderboard entries, loading state, and error
 */
export function useLeaderboard(): UseLeaderboardReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data: rows, error: dbError } = await supabase
        .from('claims')
        .select('claimer_wallet')
        .order('claimed_at', { ascending: false });

      if (dbError) throw new Error(dbError.message);

      // Aggregate in-memory
      const counts = new Map<string, number>();
      const validRows = (rows ?? []).filter((row): boolean => {
        return (
          row && 
          typeof row === 'object' && 
          !('code' in row) &&
          !('message' in row) &&
          'claimer_wallet' in row && 
          typeof (row as Record<string, unknown>).claimer_wallet === 'string'
        );
      }) as Array<{ claimer_wallet: string }>;
      for (const row of validRows) {
        counts.set(row.claimer_wallet, (counts.get(row.claimer_wallet) ?? 0) + 1);
      }

      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([walletAddress, totalClaims], index) => ({
          walletAddress,
          totalClaims,
          rank: index + 1,
        }));
    },
    staleTime: 60_000,
  });

  return {
    entries: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
