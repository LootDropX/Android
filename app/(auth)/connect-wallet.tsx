import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ConnectButton } from '../../src/components/wallet/ConnectButton';
import { useWallet } from '../../src/hooks/useWallet';
import { router } from 'expo-router';

/**
 * Full-screen wallet connection onboarding screen.
 * Shown to unauthenticated users.
 */
export default function ConnectWalletScreen(): React.JSX.Element {
  const { isConnected } = useWallet();
  const glow = useSharedValue(0.6);

  React.useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow]);

  React.useEffect(() => {
    if (isConnected) {
      router.replace('/(tabs)/map');
    }
  }, [isConnected]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.95 + glow.value * 0.05 }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, glowStyle]}>
          <Text style={styles.logo}>📍</Text>
          <Text style={styles.logoText}>LOOT DROP</Text>
        </Animated.View>

        <Text style={styles.tagline}>
          Go outside.{'\n'}Claim crypto.{'\n'}Own it forever.
        </Text>

        <Text style={styles.subtitle}>
          GPS-based on-chain asset scavenger hunt on Avalanche.
        </Text>

        <View style={styles.actions}>
          <ConnectButton label="Connect Wallet" />
          <Text style={styles.walletHint}>
            Your wallet is your identity.{'\n'}
            Compatible with MetaMask, Rabby, Core & any EVM wallet.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 24,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 64,
  },
  logoText: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
  },
  tagline: {
    color: '#F8FAFC',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 44,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: 16,
    marginTop: 16,
  },
  walletHint: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
