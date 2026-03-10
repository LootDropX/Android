import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useWallet } from '../../hooks/useWallet';

export interface WalletGuardProps {
  children: React.ReactNode;
}

/**
 * HOC that redirects unauthenticated users to the connect-wallet screen.
 * Shows a loading spinner while the session is being restored.
 */
export function WalletGuard({ children }: WalletGuardProps): React.JSX.Element {
  const { isConnected, isRestoring } = useWallet();

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  if (!isConnected) {
    return <Redirect href="/(auth)/connect-wallet" />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
