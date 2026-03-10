
/**
 * Rarity tiers for loot drops, ordered from most common to rarest.
 */
export enum RarityTier {
  COMMON = 0,
  RARE = 1,
  EPIC = 2,
  LEGENDARY = 3,
}

/**
 * Types of on-chain assets that can be placed in a drop.
 */
export enum AssetType {
  SOL = 0,
  SPL_TOKEN = 1,
  NFT = 2,
}

/**
 * Represents the current status of a claim attempt.
 */
export type ClaimStatus = 'unclaimed' | 'claiming' | 'claimed' | 'expired' | 'full';

/**
 * Core drop domain model — mirrors the on-chain Drop PDA account.
 */
export interface Drop {
  /** UUID primary key (Supabase) */
  id: string;
  /** Creator's wallet public key (base58) */
  creator: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  /** Geohash at precision 7 for spatial indexing */
  geohash: string;
  rarityTier: RarityTier;
  assetType: AssetType;
  /** Amount in lamports for SOL, raw amount for SPL tokens */
  assetAmount: number;
  /** Mint address for NFT or SPL token drops */
  mintAddress?: string;
  maxClaims: number;
  currentClaims: number;
  /** ISO 8601 timestamp */
  expiresAt: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  isActive: boolean;
  /** The on-chain Drop PDA address (base58) */
  onChainAddress: string;
}

/**
 * Recorded claim event — mirrors the on-chain ClaimRecord PDA.
 */
export interface ClaimRecord {
  id: string;
  dropId: string;
  /** Claimer's wallet public key (base58) */
  claimer: string;
  /** ISO 8601 timestamp */
  claimedAt: string;
  txSignature: string;
  /** Distance in meters from drop center at claim time */
  distance: number;
}

/**
 * A drop enriched with the user's proximity data.
 */
export interface NearbyDrop extends Drop {
  distanceMeters: number;
  /**
   * True when: within claim radius AND user hasn't claimed AND
   * drop is not expired AND claims remain.
   */
  isClaimable: boolean;
  /** Whether the current user has already claimed this drop */
  alreadyClaimed: boolean;
}

/**
 * Parameters required to create a new drop (on-chain + Supabase).
 */
export interface DropCreationParams {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  rarityTier: RarityTier;
  assetType: AssetType;
  assetAmount: number;
  mintAddress?: string;
  maxClaims: number;
  /** ISO 8601 timestamp */
  expiresAt: string;
}

/**
 * Minimal drop representation for map marker rendering.
 */
export interface MapDrop {
  id: string;
  latitude: number;
  longitude: number;
  rarityTier: RarityTier;
  isClaimable: boolean;
  currentClaims: number;
  maxClaims: number;
}

/**
 * Result returned after a successful or failed claim attempt.
 */
export interface ClaimResult {
  success: boolean;
  txSignature?: string;
  error?: ClaimError;
}

/**
 * Typed claim errors surfaced to the UI.
 */
export type ClaimError =
  | { code: 'OUT_OF_RANGE'; distanceMeters: number; requiredMeters: number }
  | { code: 'DROP_INACTIVE' }
  | { code: 'DROP_EXPIRED' }
  | { code: 'DROP_FULL' }
  | { code: 'ALREADY_CLAIMED' }
  | { code: 'WALLET_NOT_CONNECTED' }
  | { code: 'USER_REJECTED' }
  | { code: 'TX_EXPIRED' }
  | { code: 'RPC_ERROR'; message: string }
  | { code: 'UNKNOWN'; message: string };
