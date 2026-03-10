import { create } from 'zustand';

export interface WalletState {
  /** Base58-encoded public key of the connected wallet, or null */
  publicKey: string | null;
  /** MWA auth token for the current session */
  authToken: string | null;
  /** Whether the wallet session is being restored from storage */
  isRestoring: boolean;
  /** Set the connected wallet details */
  setWallet: (publicKey: string, authToken: string) => void;
  /** Clear the wallet session */
  clearWallet: () => void;
  /** Set the restoring flag */
  setRestoring: (isRestoring: boolean) => void;
}

/**
 * Zustand store for wallet session management.
 * Session persistence behavior is handled by `useWallet`.
 */
export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  authToken: null,
  isRestoring: true,
  setWallet: (publicKey, authToken) => set({ publicKey, authToken }),
  clearWallet: () => set({ publicKey: null, authToken: null }),
  setRestoring: (isRestoring) => set({ isRestoring }),
}));
