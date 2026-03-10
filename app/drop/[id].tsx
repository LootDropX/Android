import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { RarityBadge } from '../../src/components/drops/RarityBadge';
import { WalletGuard } from '../../src/components/wallet/WalletGuard';
import { useNearbyDrops } from '../../src/hooks/useNearbyDrops';
import { useClaimDrop } from '../../src/hooks/useClaimDrop';
import { useDropProximity } from '../../src/hooks/useDropProximity';
import { useLocationStore } from '../../src/stores/location.store';
import { formatSOL, formatExpiry, formatPublicKey, formatClaimsLeft } from '../../src/utils/format';
import { AssetType } from '../../src/types/drop.types';

function DropDetailContent(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { drops } = useNearbyDrops();
  const drop = drops.find((d) => d.id === id);
  const coords = useLocationStore((s) => s.coords);
  const { claim, claimState } = useClaimDrop();

  const proximity = useDropProximity(drop ?? ({} as (typeof drops)[0]), coords);
  const isClaiming = !['idle', 'success', 'error'].includes(claimState);

  if (!drop) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Drop not found.</Text>
        <Button label="Back to Map" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const rewardText =
    drop.assetType === AssetType.SOL
      ? formatSOL(drop.assetAmount)
      : drop.assetType === AssetType.NFT
        ? 'NFT'
        : `${drop.assetAmount} tokens`;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Button
          label="← Back"
          variant="ghost"
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <RarityBadge tier={drop.rarityTier} />
      </View>

      <Text style={styles.title}>{drop.title}</Text>
      <Text style={styles.creator}>By {formatPublicKey(drop.creator)}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{rewardText}</Text>
          <Text style={styles.statLabel}>Reward</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatClaimsLeft(drop.currentClaims, drop.maxClaims)}</Text>
          <Text style={styles.statLabel}>Claims</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatExpiry(drop.expiresAt)}</Text>
          <Text style={styles.statLabel}>Expires</Text>
        </View>
      </View>

      {drop.description ? (
        <Text style={styles.description}>{drop.description}</Text>
      ) : null}

      <Text style={styles.distanceText}>{proximity.proximityMessage}</Text>

      <Button
        label={claimState === 'success' ? 'Claimed! ✓' : 'Claim Drop'}
        variant="primary"
        isLoading={isClaiming}
        disabled={!proximity.isInClaimRange || claimState === 'success' || drop.alreadyClaimed}
        onPress={() => claim(drop)}
      />
    </ScrollView>
  );
}

export default function DropDetailScreen(): React.JSX.Element {
  return (
    <WalletGuard>
      <SafeAreaView style={styles.container}>
        <DropDetailContent />
      </SafeAreaView>
    </WalletGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { paddingVertical: 8, paddingHorizontal: 16 },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800' },
  creator: { color: '#94A3B8', fontSize: 14 },
  statsGrid: { flexDirection: 'row', backgroundColor: '#12121A', borderRadius: 16, padding: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  statLabel: { color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { color: '#94A3B8', fontSize: 14, lineHeight: 20 },
  distanceText: { color: '#A855F7', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText: { color: '#94A3B8', fontSize: 18 },
});
