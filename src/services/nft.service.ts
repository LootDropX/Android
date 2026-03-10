import type { InventoryItem } from '../types/nft.types';

export interface EVMAsset {
  id: string;
  name?: string;
  symbol?: string;
  imageUri?: string;
}

/**
 * Fetches all NFTs owned by a wallet on Avalanche.
 * For this hackathon, we mock this or use an Avalanche NFT indexer.
 * Here we return an empty array for now as we focus on native AVAX.
 *
 * @param walletAddress - EVM wallet address
 * @returns Array of raw asset objects
 */
export async function fetchWalletNFTs(walletAddress: string): Promise<EVMAsset[]> {
  // Mock or implement Covalent / Moralis for Avalanche NFTs
  return [];
}

/**
 * Maps an EVM asset to the app's `InventoryItem` model.
 */
export function mapEVMAssetToInventoryItem(asset: EVMAsset): InventoryItem {
  return {
    mintAddress: asset.id,
    name: asset.name ?? 'Unknown',
    symbol: asset.symbol ?? '',
    imageUri: asset.imageUri ?? '',
  };
}
