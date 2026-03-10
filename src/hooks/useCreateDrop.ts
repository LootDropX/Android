import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSDK } from '@metamask/sdk-react-native';
import { BrowserProvider, Contract } from 'ethers';
import { createDropRecord } from '../services/drops.service';
import type { DropCreationParams } from '../types/drop.types';

// The ABI for LootDrop 
const LOOTDROP_ABI = [
  "function createDrop(bytes16 uuid, string title, string description, int256 latitude, int256 longitude, uint8 rarityTier, uint8 assetType, uint256 assetAmount, uint16 maxClaims, uint256 expiresAt) external payable"
];

const LOOTDROP_ADDRESS = "0x0000000000000000000000000000000000000000"; // Target address on Fuji

export type CreateDropState = 'idle' | 'building_tx' | 'awaiting_signature' | 'confirming' | 'success' | 'error';

export interface UseCreateDropReturn {
  createDrop: (params: DropCreationParams) => Promise<{ success: boolean; error?: string }>;
  createState: CreateDropState;
  error: string | null;
}

export function useCreateDrop(): UseCreateDropReturn {
  const [createState, setCreateState] = useState<CreateDropState>('idle');
  const [error, setError] = useState<string | null>(null);

  const { provider, account } = useSDK();
  const queryClient = useQueryClient();

  const createDrop = useCallback(
    async (params: DropCreationParams): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setCreateState('building_tx');

      if (!provider || !account) {
        const msg = 'Metamask not connected';
        setError(msg);
        setCreateState('error');
        return { success: false, error: msg };
      }

      const uuidBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)));
      const uuidHex = "0x" + uuidBytes.map(b => b.toString(16).padStart(2, '0')).join('');

      try {
        setCreateState('awaiting_signature');

        const browserProvider = new BrowserProvider(provider as any);
        const signer = await browserProvider.getSigner();
        const contract = new Contract(LOOTDROP_ADDRESS, LOOTDROP_ABI, signer);

        const lat = BigInt(Math.round(params.latitude * 1_000_000));
        const lng = BigInt(Math.round(params.longitude * 1_000_000));
        const expiresAt = BigInt(Math.floor(new Date(params.expiresAt).getTime() / 1000));

        const assetAmount = params.assetAmount.toString();
        const valueToSend = params.assetType === 0 ? assetAmount : 0;

        const tx = await contract.createDrop(
          uuidHex,
          params.title,
          params.description,
          lat,
          lng,
          params.rarityTier,
          params.assetType,
          assetAmount,
          params.maxClaims,
          expiresAt,
          { value: valueToSend }
        );

        setCreateState('confirming');
        const receipt = await tx.wait();

        try {
          await createDropRecord({
            onChainAddress: uuidHex, // Map UUID to onChainAddress for Supabase consistency
            creatorWallet: account,
            ...params,
          });
        } catch {
          // Non-fatal
        }

        setCreateState('success');
        queryClient.invalidateQueries({ queryKey: ['nearby-drops'] });
        queryClient.invalidateQueries({ queryKey: ['global-drops'] });

        return { success: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transaction failed';
        setError(msg);
        setCreateState('error');
        return { success: false, error: msg };
      }
    },
    [provider, account, queryClient],
  );

  return { createDrop, createState, error };
}
