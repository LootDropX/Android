/**
 * NFT metadata conforming to the Metaplex Token Metadata standard.
 */
export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: NFTAttribute[];
  properties?: NFTProperties;
}

export interface NFTAttribute {
  traitType: string;
  value: string | number;
}

export interface NFTProperties {
  files?: NFTFile[];
  category?: string;
  creators?: NFTCreator[];
}

export interface NFTFile {
  uri: string;
  type: string;
}

export interface NFTCreator {
  address: string;
  share: number;
  verified?: boolean;
}

/**
 * An inventory item — an on-chain NFT enriched with claim metadata.
 */
export interface InventoryItem {
  /** Mint address (base58) */
  mintAddress: string;
  name: string;
  symbol: string;
  imageUri: string;
  /** Drop ID from Supabase (if this NFT was obtained via a drop) */
  dropId?: string;
  /** ISO 8601 timestamp */
  claimedAt?: string;
  txSignature?: string;
  /** Distance in meters at claim time */
  distanceAtClaim?: number;
  rarityTier?: number;
}
