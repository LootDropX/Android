import { supabase } from './supabase';
import { encode as geohashEncode } from './geohash.service';
import type { Drop, ClaimRecord } from '../types/drop.types';
import type { DropsRow, ClaimsRow } from '../types/supabase.types';
import { parsePointLocation } from '../utils/location';

/**
 * Maps a Supabase `drops` row to the app's `Drop` domain model.
 */
function mapRowToDrop(row: DropsRow): Drop {
  const parsedLocation = parsePointLocation(row.location);
  const latitude = parsedLocation?.latitude ?? 0;
  const longitude = parsedLocation?.longitude ?? 0;

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
  };
}

/**
 * Maps a Supabase `claims` row to the app's `ClaimRecord` domain model.
 */
function mapRowToClaimRecord(row: ClaimsRow): ClaimRecord {
  return {
    id: row.id,
    dropId: row.drop_id,
    claimer: row.claimer_wallet,
    claimedAt: row.claimed_at,
    txSignature: row.tx_signature,
    distance: row.distance_meters,
  };
}

/**
 * Fetches drops within a radius of the user's location via the
 * `nearby-drops` Supabase Edge Function.
 *
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @param radiusMeters - Search radius (max 5000)
 * @param walletAddress - Optional wallet to check for prior claims
 * @returns Array of drops with distance and already_claimed flag
 */
export async function fetchNearbyDrops(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  walletAddress?: string,
): Promise<Array<DropsRow & { distance_meters: number; already_claimed: boolean }>> {
  const { data, error } = await supabase.functions.invoke<{
    drops: Array<DropsRow & { distance_meters: number; already_claimed: boolean }>;
  }>('nearby-drops', {
    body: { latitude, longitude, radius_meters: radiusMeters, wallet_address: walletAddress },
  });

  if (error) throw new Error(`nearby-drops edge function error: ${error.message}`);
  return data?.drops ?? [];
}

/**
 * Fetches globally available drops.
 *
 * Availability means:
 * - `is_active = true`
 * - `expires_at` is in the future
 * - `current_claims < max_claims`
 *
 * @param limit - Max rows to return (sorted by newest first)
 */
export async function fetchGlobalDrops(limit = 200): Promise<Drop[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('drops')
    .select('*')
    .eq('is_active', true)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch global drops: ${error.message}`);

  return ((data ?? []) as DropsRow[])
    .filter((row) => row.current_claims < row.max_claims)
    .map(mapRowToDrop);
}

/**
 * Inserts a new drop record into Supabase after the on-chain transaction confirms.
 */
export async function createDropRecord(params: {
  onChainAddress: string;
  creatorWallet: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  rarityTier: number;
  assetType: number;
  assetAmount: number;
  mintAddress?: string;
  maxClaims: number;
  expiresAt: string;
}): Promise<Drop> {
  const geohash = geohashEncode(params.latitude, params.longitude, 7);

  const { data, error } = await supabase
    .from('drops')
    .insert([
      {
        on_chain_address: params.onChainAddress,
        creator_wallet: params.creatorWallet,
        title: params.title,
        description: params.description,
        // WKT format requires longitude first, latitude second
        location: `POINT(${params.longitude} ${params.latitude})`,
        geohash,
        rarity_tier: params.rarityTier,
        asset_type: params.assetType,
        asset_amount: params.assetAmount,
        mint_address: params.mintAddress ?? null,
        max_claims: params.maxClaims,
        expires_at: params.expiresAt,
      },
    ])
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create drop record: ${error.message}`);
  return mapRowToDrop(data as DropsRow);
}

/**
 * Inserts a claim record into Supabase after the on-chain transaction confirms.
 */
export async function createClaimRecord(params: {
  dropId: string;
  dropOnChainAddress: string;
  claimerWallet: string;
  txSignature: string;
  distanceMeters: number;
}): Promise<ClaimRecord> {
  const { data, error } = await supabase
    .from('claims')
    .insert({
      drop_id: params.dropId,
      drop_on_chain_address: params.dropOnChainAddress,
      claimer_wallet: params.claimerWallet,
      tx_signature: params.txSignature,
      distance_meters: params.distanceMeters,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to create claim record: ${error?.message}`);
  return mapRowToClaimRecord(data as ClaimsRow);
}

/**
 * Fetches all claims for a given wallet address.
 */
export async function fetchClaimsByWallet(walletAddress: string): Promise<ClaimRecord[]> {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('claimer_wallet', walletAddress)
    .order('claimed_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch claims: ${error.message}`);
  return ((data ?? []) as ClaimsRow[]).map(mapRowToClaimRecord);
}
