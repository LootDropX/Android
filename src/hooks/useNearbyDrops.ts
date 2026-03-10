import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchNearbyDrops } from '../services/drops.service';
import { useLocationStore } from '../stores/location.store';
import { useWalletStore } from '../stores/wallet.store';
import { useMapStore } from '../stores/map.store';
import { CLAIM_RADIUS } from '../constants/rarity';
import { NEARBY_DROPS_RADIUS_M, NEARBY_DROPS_POLL_MS } from '../constants/map';
import { parsePointLocation } from '../utils/location';
import type { NearbyDrop } from '../types/drop.types';
import type { DropsRow } from '../types/supabase.types';

/** Round to 4 decimal places to prevent excessive cache-key churn */
function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

/**
 * Maps a raw Supabase nearby-drop result to a `NearbyDrop` domain model.
 */
function mapToNearbyDrop(
  row: DropsRow & { distance_meters: number; already_claimed: boolean },
  userLat: number,
  userLng: number,
): NearbyDrop {
  const parsedLocation = parsePointLocation(row.location);
  const latitude = parsedLocation?.latitude ?? 0;
  const longitude = parsedLocation?.longitude ?? 0;

  const distanceMeters = row.distance_meters;
  const claimRadius = CLAIM_RADIUS[row.rarity_tier as keyof typeof CLAIM_RADIUS] ?? 50;
  const now = new Date();
  const expired = new Date(row.expires_at) < now;

  const isClaimable =
    row.is_active &&
    !expired &&
    !row.already_claimed &&
    row.current_claims < row.max_claims &&
    distanceMeters <= claimRadius;

  return {
    id: row.id,
    creator: row.creator_wallet,
    title: row.title,
    description: row.description ?? '',
    latitude,
    longitude,
    geohash: row.geohash,
    rarityTier: row.rarity_tier,
    assetType: row.asset_type,
    assetAmount: row.asset_amount,
    mintAddress: row.mint_address ?? undefined,
    maxClaims: row.max_claims,
    currentClaims: row.current_claims,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    isActive: row.is_active,
    onChainAddress: row.on_chain_address,
    distanceMeters,
    isClaimable,
    alreadyClaimed: row.already_claimed,
  };
}

export interface UseNearbyDropsReturn {
  drops: NearbyDrop[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches drops within `NEARBY_DROPS_RADIUS_M` of the user's current position.
 *
 * - Polls every 30 seconds
 * - Refetches when the app returns to the foreground
 * - Rounds coordinates to 4 decimal places to stabilise the query key
 *
 * @returns Drops array, loading/error states, and a manual refetch function
 */
export function useNearbyDrops(): UseNearbyDropsReturn {
  const rawCoords = useLocationStore((s) => s.coords);
  const devMode = useMapStore((s) => s.devModeEnabled);
  const devCoords = useMapStore((s) => s.devModeCoords);
  const publicKey = useWalletStore((s) => s.publicKey);

  const coords = devMode && devCoords ? devCoords : rawCoords;

  const lat = coords ? round4(coords.latitude) : null;
  const lng = coords ? round4(coords.longitude) : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['nearby-drops', lat, lng],
    queryFn: async () => {
      if (lat === null || lng === null) return [];
      const rows = await fetchNearbyDrops(lat, lng, NEARBY_DROPS_RADIUS_M, publicKey ?? undefined);
      return rows.map((row) => mapToNearbyDrop(row, lat, lng));
    },
    enabled: lat !== null && lng !== null,
    refetchInterval: NEARBY_DROPS_POLL_MS,
    staleTime: 10_000,
  });

  // Refetch when the app comes back to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  return {
    drops: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
