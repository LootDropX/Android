import { useMemo } from 'react';
import { haversineDistance } from '../utils/distance';
import { CLAIM_RADIUS } from '../constants/rarity';
import type { NearbyDrop } from '../types/drop.types';
import type { Coords } from '../stores/location.store';

export interface UseDropProximityReturn {
  distanceMeters: number;
  isInClaimRange: boolean;
  proximityMessage: string;
}

/**
 * Computes the distance between the user and a specific drop,
 * and determines whether the user is within the claim radius.
 *
 * Re-evaluates reactively when either `drop` or `coords` changes.
 *
 * @param drop - The nearby drop to check proximity for
 * @param coords - The user's current GPS coordinates
 * @returns Distance, claim eligibility, and a human-readable proximity message
 */
export function useDropProximity(
  drop: NearbyDrop,
  coords: Coords | null,
): UseDropProximityReturn {
  return useMemo<UseDropProximityReturn>(() => {
    if (!coords) {
      return {
        distanceMeters: Infinity,
        isInClaimRange: false,
        proximityMessage: 'Getting your location…',
      };
    }

    const distanceMeters = haversineDistance(
      coords.latitude,
      coords.longitude,
      drop.latitude,
      drop.longitude,
    );

    const claimRadius = CLAIM_RADIUS[drop.rarityTier];
    const isInClaimRange = distanceMeters <= claimRadius;

    let proximityMessage: string;
    if (isInClaimRange) {
      proximityMessage = "You're in range!";
    } else if (distanceMeters < 1000) {
      proximityMessage = `${Math.round(distanceMeters)}m away`;
    } else {
      proximityMessage = `${(distanceMeters / 1000).toFixed(1)}km away`;
    }

    return { distanceMeters, isInClaimRange, proximityMessage };
  }, [coords?.latitude, coords?.longitude, drop.latitude, drop.longitude, drop.rarityTier]);
}
