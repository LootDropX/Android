import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { WalletGuard } from '../../src/components/wallet/WalletGuard';
import { Button } from '../../src/components/ui/Button';
import { useWallet } from '../../src/hooks/useWallet';
import { useLeaderboard } from '../../src/hooks/useLeaderboard';
import { useMapStore } from '../../src/stores/map.store';
import { formatPublicKey } from '../../src/utils/format';
import { DEMO_DROP_COORDS } from '../../src/constants/demoDrop';

const IS_DEVNET = true;

function ProfileContent(): React.JSX.Element {
  const { publicKey, disconnect } = useWallet();
  const { entries, isLoading } = useLeaderboard();
  const { devModeEnabled, toggleDevMode, setDevModeCoords } = useMapStore();

  const userRank = entries.findIndex((e) => e.walletAddress === publicKey) + 1;

  const handleEnableDevMode = (value: boolean): void => {
    toggleDevMode();
    if (value) {
      setDevModeCoords(DEMO_DROP_COORDS);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {devModeEnabled && (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>⚠️ DEV MODE — GPS OVERRIDDEN</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Wallet</Text>
        <Text style={styles.pubkey}>{publicKey ? formatPublicKey(publicKey) : '—'}</Text>
        <Button
          label="Disconnect"
          variant="danger"
          onPress={disconnect}
          style={styles.disconnectBtn}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Leaderboard</Text>
        {isLoading ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : (
          entries.slice(0, 10).map((entry) => (
            <View key={entry.walletAddress} style={styles.leaderRow}>
              <Text style={styles.rank}>#{entry.rank}</Text>
              <Text style={styles.wallet}>{formatPublicKey(entry.walletAddress)}</Text>
              <Text style={styles.claims}>{entry.totalClaims} claims</Text>
            </View>
          ))
        )}
        {userRank > 0 && (
          <Text style={styles.yourRank}>Your rank: #{userRank}</Text>
        )}
      </View>

      {IS_DEVNET && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Developer Mode</Text>
          <Text style={styles.devDescription}>
            Overrides GPS with the demo drop coordinates for testing.
          </Text>
          <View style={styles.devToggleRow}>
            <Text style={styles.devToggleLabel}>Enable Dev Mode</Text>
            <Switch
              value={devModeEnabled}
              onValueChange={handleEnableDevMode}
              trackColor={{ false: '#1C1C2E', true: '#7C3AED' }}
              thumbColor="#F8FAFC"
            />
          </View>
          {devModeEnabled && (
            <Text style={styles.devCoords}>
              📍 {DEMO_DROP_COORDS.latitude.toFixed(5)}, {DEMO_DROP_COORDS.longitude.toFixed(5)}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  return (
    <WalletGuard>
      <SafeAreaView style={styles.safeArea}>
        <ProfileContent />
      </SafeAreaView>
    </WalletGuard>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0A0F' },
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  devBanner: {
    backgroundColor: '#F59E0B',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  devBannerText: { color: '#0A0A0F', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionLabel: { color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  pubkey: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  disconnectBtn: { marginTop: 4 },
  loading: { color: '#475569', fontSize: 14 },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  rank: { color: '#7C3AED', fontSize: 14, fontWeight: '700', width: 32 },
  wallet: { color: '#F8FAFC', fontSize: 14, flex: 1 },
  claims: { color: '#94A3B8', fontSize: 13 },
  yourRank: { color: '#A855F7', fontSize: 13, textAlign: 'center', marginTop: 4 },
  devDescription: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },
  devToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  devToggleLabel: { color: '#F8FAFC', fontSize: 15 },
  devCoords: { color: '#F59E0B', fontSize: 12, textAlign: 'center' },
});
