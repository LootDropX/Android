import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WalletGuard } from '../../src/components/wallet/WalletGuard';
import { DropCard } from '../../src/components/drops/DropCard';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { useInventory } from '../../src/hooks/useInventory';
import { formatSOL } from '../../src/utils/format';
import type { InventoryItem } from '../../src/types/nft.types';

function InventoryContent(): React.JSX.Element {
  const { nfts, solEarned, totalClaims, isLoading, refetch } = useInventory();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  };

  const handleItemPress = (item: InventoryItem): void => {
    // Navigate to claim record detail
    console.log('View item:', item.mintAddress);
  };

  const renderItem = ({ item, index }: { item: InventoryItem; index: number }) => {
    if (index % 2 === 1) return null; // skip odd indices, rendered in pairs
    const next = nfts[index + 1];
    return (
      <View style={styles.row}>
        <DropCard item={item} onPress={handleItemPress} />
        {next ? (
          <DropCard item={next} onPress={handleItemPress} />
        ) : (
          <View style={styles.emptyCell} />
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.row}>
            <LoadingPulse width={160} height={200} borderRadius={16} />
            <LoadingPulse width={160} height={200} borderRadius={16} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={nfts.filter((_, i) => i % 2 === 0)}
      renderItem={renderItem}
      keyExtractor={(_, i) => String(i)}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Your Loot</Text>
            <View style={styles.earnedPill}>
              <Text style={styles.earnedText}>{formatSOL(solEarned * 1e9)} earned</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalClaims}</Text>
              <Text style={styles.statLabel}>Total Claims</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{nfts.length}</Text>
              <Text style={styles.statLabel}>NFTs</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎒</Text>
          <Text style={styles.emptyTitle}>No loot yet.</Text>
          <Text style={styles.emptySubtitle}>Go outside.</Text>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => router.push('/(tabs)/map')}
          >
            <Text style={styles.mapButtonLabel}>Open Map →</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

export default function InventoryScreen(): React.JSX.Element {
  return (
    <WalletGuard>
      <SafeAreaView style={styles.container}>
        <InventoryContent />
      </SafeAreaView>
    </WalletGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  listContent: { padding: 16, gap: 0 },
  loadingContainer: { padding: 16, gap: 12 },
  header: { marginBottom: 20, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800' },
  earnedPill: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  earnedText: { color: '#A855F7', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 16 },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { color: '#F8FAFC', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 0 },
  emptyCell: { flex: 1, margin: 6 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '700' },
  emptySubtitle: { color: '#94A3B8', fontSize: 18 },
  mapButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  mapButtonLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
