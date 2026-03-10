import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WalletGuard } from '../../src/components/wallet/WalletGuard';
import { Button } from '../../src/components/ui/Button';
import { RarityBadge } from '../../src/components/drops/RarityBadge';
import { useCreateDrop } from '../../src/hooks/useCreateDrop';
import { useLocationStore } from '../../src/stores/location.store';
import { RarityTier, AssetType } from '../../src/types/drop.types';
import { RARITY_LABELS } from '../../src/constants/rarity';

const RARITY_TIERS = [RarityTier.COMMON, RarityTier.RARE, RarityTier.EPIC, RarityTier.LEGENDARY];
const ASSET_TYPES: Array<{ id: string; label: string; value: AssetType; mintAddress?: string }> = [
  { id: 'sol', label: 'SOL', value: AssetType.SOL },
  { id: 'usdc', label: 'USDC', value: AssetType.SPL_TOKEN, mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { id: 'skr', label: '$SKR', value: AssetType.SPL_TOKEN, mintAddress: 'SKR1111111111111111111111111111111111111111' },
  { id: 'nft', label: 'NFT', value: AssetType.NFT },
];

function CreateDropContent(): React.JSX.Element {
  const coords = useLocationStore((s) => s.coords);
  const { createDrop, createState } = useCreateDrop();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rarityTier, setRarityTier] = useState<RarityTier>(RarityTier.COMMON);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('sol');
  const [assetAmount, setAssetAmount] = useState('');
  const [maxClaims, setMaxClaims] = useState('1');

  const isSubmitting = !['idle', 'success', 'error'].includes(createState);

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for your drop.');
      return;
    }
    if (!coords) {
      Alert.alert('No location', 'Unable to get your current location.');
      return;
    }
    if (!assetAmount || isNaN(parseFloat(assetAmount))) {
      Alert.alert('Invalid amount', 'Please enter a valid asset amount.');
      return;
    }

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const selectedAsset = ASSET_TYPES.find(a => a.id === selectedAssetId)!;
    const amountLamports = selectedAsset.value === AssetType.SOL
      ? Math.round(parseFloat(assetAmount) * 1e9)
      : parseFloat(assetAmount);

    const result = await createDrop({
      title: title.trim(),
      description: description.trim(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      rarityTier,
      assetType: selectedAsset.value,
      assetAmount: amountLamports,
      mintAddress: selectedAsset.mintAddress,
      maxClaims: parseInt(maxClaims, 10) || 1,
      expiresAt,
    });

    if (result.success) {
      Alert.alert('Drop Created!', 'Your drop is now live on the map.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/map') },
      ]);
    } else {
      Alert.alert('Failed', result.error ?? 'Unknown error');
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Create Drop</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Title ({title.length}/50)</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={(t) => setTitle(t.slice(0, 50))}
          placeholder="e.g. Shadow Cache"
          placeholderTextColor="#475569"
          maxLength={50}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Description ({description.length}/200)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={(t) => setDescription(t.slice(0, 200))}
          placeholder="What's in the drop?"
          placeholderTextColor="#475569"
          multiline
          numberOfLines={3}
          maxLength={200}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Rarity Tier</Text>
        <View style={styles.rarityRow}>
          {RARITY_TIERS.map((tier) => (
            <TouchableOpacity
              key={tier}
              onPress={() => setRarityTier(tier)}
              style={[styles.rarityOption, rarityTier === tier && styles.raritySelected]}
            >
              <Text style={styles.rarityLabel}>{RARITY_LABELS[tier]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Asset Type</Text>
        <View style={styles.segmentRow}>
          {ASSET_TYPES.map(({ id, label }) => (
            <TouchableOpacity
              key={id}
              style={[styles.segment, selectedAssetId === id && styles.segmentActive]}
              onPress={() => setSelectedAssetId(id)}
            >
              <Text style={[styles.segmentLabel, selectedAssetId === id && styles.segmentLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {ASSET_TYPES.find(a => a.id === selectedAssetId)?.value === AssetType.SOL ? 'Amount (SOL)' : 'Token Amount'}
        </Text>
        <TextInput
          style={styles.input}
          value={assetAmount}
          onChangeText={setAssetAmount}
          placeholder={ASSET_TYPES.find(a => a.id === selectedAssetId)?.value === AssetType.SOL ? '0.01' : '1'}
          placeholderTextColor="#475569"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Max Claims (1–100)</Text>
        <TextInput
          style={styles.input}
          value={maxClaims}
          onChangeText={setMaxClaims}
          placeholder="1"
          placeholderTextColor="#475569"
          keyboardType="number-pad"
        />
      </View>

      {coords ? (
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>📍 Drop at current location</Text>
          <Text style={styles.locationCoords}>
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        </View>
      ) : (
        <View style={styles.locationInfo}>
          <Text style={styles.locationError}>Getting your location…</Text>
        </View>
      )}

      <Button
        label={createState === 'success' ? 'Drop Created! ✓' : 'Create Drop'}
        variant="primary"
        isLoading={isSubmitting}
        disabled={isSubmitting || !coords || createState === 'success'}
        onPress={handleSubmit}
      />
    </ScrollView>
  );
}

export default function CreateDropScreen(): React.JSX.Element {
  return (
    <WalletGuard>
      <SafeAreaView style={styles.container}>
        <CreateDropContent />
      </SafeAreaView>
    </WalletGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backText: { color: '#7C3AED', fontSize: 16 },
  pageTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '800' },
  field: { gap: 8 },
  fieldLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  multiline: { height: 96, textAlignVertical: 'top' },
  rarityRow: { flexDirection: 'row', gap: 8 },
  rarityOption: {
    flex: 1,
    backgroundColor: '#12121A',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  raritySelected: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.1)' },
  rarityLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  segmentRow: { flexDirection: 'row', backgroundColor: '#12121A', borderRadius: 10, padding: 4, gap: 4 },
  segment: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: '#7C3AED' },
  segmentLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  segmentLabelActive: { color: '#FFFFFF' },
  locationInfo: { backgroundColor: '#12121A', borderRadius: 12, padding: 12, gap: 4 },
  locationLabel: { color: '#94A3B8', fontSize: 13 },
  locationCoords: { color: '#F8FAFC', fontSize: 13, fontFamily: 'monospace' },
  locationError: { color: '#F59E0B', fontSize: 13 },
});
