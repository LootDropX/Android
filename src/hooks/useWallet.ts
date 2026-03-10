import { useEffect, useCallback } from 'react';
import { useSDK } from '@metamask/sdk-react-native';
import { AppState } from 'react-native';
import { useWalletStore } from '../stores/wallet.store';

export interface UseWalletReturn {
  publicKey: string | null;
  isConnected: boolean;
  isRestoring: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Manages the Metamask EVM wallet session connection and disconnection.
 */
export function useWallet(): UseWalletReturn {
  const { sdk, provider, account, connected, connecting, ready } = useSDK();
  const { publicKey, authToken, isRestoring, setWallet, clearWallet, setRestoring } = useWalletStore();

  const syncWalletFromProvider = useCallback(async (): Promise<void> => {
    if (!provider?.request) return;

    try {
      const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
      const firstAccount = accounts?.[0] ?? null;

      if (firstAccount) {
        setWallet(firstAccount, 'metamask_session');
        return;
      }

      // Only clear when the provider explicitly reports no selected account.
      clearWallet();
    } catch (error) {
      console.warn('[useWallet] Failed to sync wallet from provider:', error);
    }
  }, [provider, setWallet, clearWallet]);

  useEffect(() => {
    console.log("[useWallet] State changed:", { connected, account, connecting, ready });

    if (account) {
      setWallet(account, 'metamask_session');
    } else if (ready && !connecting) {
      // After returning from MetaMask, account can lag behind SDK flags.
      void syncWalletFromProvider();
    }

    setRestoring(false);
  }, [connected, account, connecting, ready, setWallet, setRestoring, syncWalletFromProvider]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Re-check wallet every time user returns from MetaMask app.
        void syncWalletFromProvider();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [syncWalletFromProvider]);

  const connect = useCallback(async (): Promise<void> => {
    console.log("[useWallet] >>> Connect button pressed. SDK Ready:", ready);
    if (!sdk) {
      console.error("[useWallet] SDK instance is null");
      return;
    }

    try {
      console.log("[useWallet] Calling sdk.connect()...");

      // Set a timeout to catch if it hangs
      const timeoutId = setTimeout(() => {
        console.warn("[useWallet] sdk.connect() is taking a long time. MetaMask might be stuck or handshake failed.");
      }, 10000);

      const accounts = await sdk.connect();
      clearTimeout(timeoutId);

      console.log("[useWallet] <<< sdk.connect() resolved with:", accounts);

      if (accounts?.[0]) {
        console.log("[useWallet] Setting wallet address:", accounts[0]);
        setWallet(accounts[0], 'metamask_session');
      } else {
        console.warn("[useWallet] No accounts returned from MetaMask");
        // Fallback for cases where deep-link callback resolves state asynchronously.
        await syncWalletFromProvider();
      }
    } catch (e: any) {
      console.error("[useWallet] CRITICAL ERROR during sdk.connect():", {
        message: e.message,
        code: e.code,
        stack: e.stack
      });

      // Best-effort sync in case connection succeeded but promise rejected/timed out.
      await syncWalletFromProvider();
    }
  }, [sdk, setWallet, ready, syncWalletFromProvider]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (sdk) {
      // Disconnecting the SDK clears the session
      sdk.terminate();
      clearWallet();
    }
  }, [sdk, clearWallet]);

  return {
    publicKey: account || publicKey,
    isConnected: !!(account || connected || publicKey),
    isRestoring,
    connect,
    disconnect,
  };
}
