import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSDK } from '@metamask/sdk-react-native';
import { BrowserProvider, Contract } from 'ethers';
import * as Haptics from 'expo-haptics';
import { useWalletStore } from '../stores/wallet.store';
import { useLocationStore } from '../stores/location.store';
import { useMapStore } from '../stores/map.store';
import { haversineDistance } from '../utils/distance';
import { CLAIM_RADIUS } from '../constants/rarity';
import { createClaimRecord } from '../services/drops.service';
import type { NearbyDrop, ClaimResult, ClaimError } from '../types/drop.types';

const LOOTDROP_ABI = [
  "function claimDrop(bytes16 uuid, uint32 distanceCm) external"
];
const LOOTDROP_ADDRESS = "0x0000000000000000000000000000000000000000";

export type ClaimState = 'idle' | 'validating' | 'building_tx' | 'awaiting_signature' | 'confirming' | 'success' | 'error';

export interface UseClaimDropReturn {
  claim: (drop: NearbyDrop) => Promise<ClaimResult>;
  claimState: ClaimState;
  error: ClaimError | null;
  lastTxSignature: string | null;
}

export function useClaimDrop(): UseClaimDropReturn {
  const [claimState, setClaimState] = useState<ClaimState>('idle');
  const [error, setError] = useState<ClaimError | null>(null);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

  const { publicKey, authToken } = useWalletStore();
  const { provider, account } = useSDK();

  const rawCoords = useLocationStore((s) => s.coords);
  const devMode = useMapStore((s) => s.devModeEnabled);
  const devCoords = useMapStore((s) => s.devModeCoords);
  const queryClient = useQueryClient();

  const coords = devMode && devCoords ? devCoords : rawCoords;

  const claim = useCallback(
    async (drop: NearbyDrop): Promise<ClaimResult> => {
      setError(null);
      setClaimState('validating');

      if (!provider || !account) {
        const err: ClaimError = { code: 'WALLET_NOT_CONNECTED' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (!coords) {
        const err: ClaimError = { code: 'OUT_OF_RANGE', distanceMeters: Infinity, requiredMeters: CLAIM_RADIUS[drop.rarityTier] };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      const distanceMeters = haversineDistance(
        coords.latitude,
        coords.longitude,
        drop.latitude,
        drop.longitude,
      );
      const claimRadius = CLAIM_RADIUS[drop.rarityTier];

      if (distanceMeters > claimRadius) {
        const err: ClaimError = { code: 'OUT_OF_RANGE', distanceMeters, requiredMeters: claimRadius };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (!drop.isActive) {
        const err: ClaimError = { code: 'DROP_INACTIVE' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (new Date(drop.expiresAt) < new Date()) {
        const err: ClaimError = { code: 'DROP_EXPIRED' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (drop.currentClaims >= drop.maxClaims) {
        const err: ClaimError = { code: 'DROP_FULL' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (drop.alreadyClaimed) {
        const err: ClaimError = { code: 'ALREADY_CLAIMED' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      setClaimState('awaiting_signature');

      try {
        const browserProvider = new BrowserProvider(provider as any);
        const signer = await browserProvider.getSigner();
        const contract = new Contract(LOOTDROP_ADDRESS, LOOTDROP_ABI, signer);
        const distanceCm = Math.round(distanceMeters * 100);

        const tx = await contract.claimDrop(drop.onChainAddress, distanceCm);

        setClaimState('confirming');
        const receipt = await tx.wait();

        const txHash = receipt.hash || tx.hash;

        try {
          await createClaimRecord({
            dropId: drop.id,
            dropOnChainAddress: drop.onChainAddress,
            claimerWallet: account,
            txSignature: txHash,
            distanceMeters,
          });
        } catch {
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastTxSignature(txHash);
        setClaimState('success');

        queryClient.invalidateQueries({ queryKey: ['nearby-drops'] });
        queryClient.invalidateQueries({ queryKey: ['global-drops'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });

        return { success: true, txSignature: txHash };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown';
        const err: ClaimError = msg.toLowerCase().includes('reject')
          ? { code: 'USER_REJECTED' }
          : { code: 'UNKNOWN', message: msg };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }
    },
    [provider, account, coords, queryClient, devMode, devCoords],
  );

  return { claim, claimState, error, lastTxSignature };
}
