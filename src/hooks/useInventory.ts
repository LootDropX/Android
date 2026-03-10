import { useQuery } from '@tanstack/react-query';
import { useWalletStore } from '../stores/wallet.store';
import { fetchWalletNFTs, mapEVMAssetToInventoryItem } from '../services/nft.service';
import { fetchClaimsByWallet } from '../services/drops.service';
import type { InventoryItem } from '../types/nft.types';

export interface UseInventoryReturn {
  nfts: InventoryItem[];
  avaxEarned: number;
  totalClaims: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches the user's on-chain NFT inventory, enriched
 * with off-chain claim metadata from Supabase.
 *
 * @returns Inventory items, earnings summary, loading/error states
 */
export function useInventory(): UseInventoryReturn {
  const publicKey = useWalletStore((s) => s.publicKey);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', publicKey],
    queryFn: async (): Promise<{
      nfts: InventoryItem[];
      avaxEarned: number;
      totalClaims: number;
    }> => {
      if (!publicKey) return { nfts: [], avaxEarned: 0, totalClaims: 0 };

      const [evmAssets, claimRecords] = await Promise.all([
        fetchWalletNFTs(publicKey),
        fetchClaimsByWallet(publicKey),
      ]);

      // Map assets to inventory items
      const items = evmAssets.map((asset) => {
        const base = mapEVMAssetToInventoryItem(asset);
        // Enrich with claim metadata if available
        const claim = claimRecords.find((c) => c.dropId === asset.id);
        return {
          ...base,
          dropId: claim?.dropId,
          claimedAt: claim?.claimedAt,
          txSignature: claim?.txSignature,
          distanceAtClaim: claim?.distance,
        };
      });

      return {
        nfts: items,
        avaxEarned: 0, // TODO: aggregate from AVAX drop claims
        totalClaims: claimRecords.length,
      };
    },
    enabled: !!publicKey,
    staleTime: 60_000,
  });

  return {
    nfts: data?.nfts ?? [],
    avaxEarned: data?.avaxEarned ?? 0,
    totalClaims: data?.totalClaims ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
