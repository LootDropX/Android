const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Formats a lamport amount as a SOL string.
 * @example formatSOL(50_000_000) // "0.05 SOL"
 */
export function formatSOL(lamports: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  return `${sol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL`;
}

/**
 * Formats a lamport amount as a USD string using a live SOL price.
 * @example formatUSD(50_000_000, 168.5) // "$8.43"
 */
export function formatUSD(lamports: number, solPriceUSD: number): string {
  const usd = (lamports / LAMPORTS_PER_SOL) * solPriceUSD;
  return `$${usd.toFixed(2)}`;
}

/**
 * Truncates a base58 public key for display.
 * @example formatPublicKey("7xKpABC...3mNq") // "7xKp...3mNq"
 */
export function formatPublicKey(pubkey: string): string {
  if (pubkey.length <= 8) return pubkey;
  return `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
}

/**
 * Formats an ISO 8601 expiry timestamp into a human-readable countdown.
 * @example formatExpiry("2024-01-01T00:00:00Z") // "23h 14m" | "Expired"
 */
export function formatExpiry(isoString: string): string {
  const expiresAt = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) return 'Expired';

  const diffSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Formats a distance in metres to a human-readable string.
 * @example formatDistance(14) // "14m"
 * @example formatDistance(1200) // "1.2km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Formats the claim count for display.
 * @example formatClaimsLeft(3, 10) // "3 / 10 claimed"
 */
export function formatClaimsLeft(current: number, max: number): string {
  return `${current} / ${max} claimed`;
}
