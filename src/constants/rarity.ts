import { RarityTier } from '../types/drop.types';

/** Spawn weight percentages — must sum to 100 */
export const RARITY_SPAWN_WEIGHTS: Record<RarityTier, number> = {
  [RarityTier.COMMON]: 60,
  [RarityTier.RARE]: 25,
  [RarityTier.EPIC]: 12,
  [RarityTier.LEGENDARY]: 3,
};

/** Claim radius in meters per rarity tier */
export const CLAIM_RADIUS: Record<RarityTier, number> = {
  [RarityTier.COMMON]: 50,
  [RarityTier.RARE]: 75,
  [RarityTier.EPIC]: 100,
  [RarityTier.LEGENDARY]: 150,
};

/** Hex color per rarity tier for map markers and badges */
export const RARITY_COLORS: Record<RarityTier, string> = {
  [RarityTier.COMMON]: '#6B7280',
  [RarityTier.RARE]: '#3B82F6',
  [RarityTier.EPIC]: '#8B5CF6',
  [RarityTier.LEGENDARY]: '#F59E0B',
};

/** Human-readable rarity label */
export const RARITY_LABELS: Record<RarityTier, string> = {
  [RarityTier.COMMON]: 'Common',
  [RarityTier.RARE]: 'Rare',
  [RarityTier.EPIC]: 'Epic',
  [RarityTier.LEGENDARY]: 'Legendary',
};

/** SOL reward ranges per rarity (in SOL, not lamports) */
export const RARITY_SOL_RANGES: Record<RarityTier, { min: number; max: number }> = {
  [RarityTier.COMMON]: { min: 0.001, max: 0.01 },
  [RarityTier.RARE]: { min: 0.01, max: 0.1 },
  [RarityTier.EPIC]: { min: 0.1, max: 0.5 },
  [RarityTier.LEGENDARY]: { min: 0.5, max: 2.0 },
};

/** Pulse animation duration in ms per rarity tier */
export const RARITY_PULSE_DURATION: Record<RarityTier, number> = {
  [RarityTier.COMMON]: 2000,
  [RarityTier.RARE]: 1500,
  [RarityTier.EPIC]: 1000,
  [RarityTier.LEGENDARY]: 800,
};

/** Number of pulse rings per rarity tier */
export const RARITY_RING_COUNT: Record<RarityTier, number> = {
  [RarityTier.COMMON]: 1,
  [RarityTier.RARE]: 2,
  [RarityTier.EPIC]: 3,
  [RarityTier.LEGENDARY]: 3,
};
