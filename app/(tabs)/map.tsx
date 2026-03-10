import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WalletGuard } from '../../src/components/wallet/WalletGuard';
import { GeoapifyMap } from '../../src/components/map/GeoapifyMap';
import { DropDetailSheet } from '../../src/components/drops/DropDetailSheet';
import { useLocation } from '../../src/hooks/useLocation';
import { useNearbyDrops } from '../../src/hooks/useNearbyDrops';
import { useGlobalDrops } from '../../src/hooks/useGlobalDrops';
import { useMapStore } from '../../src/stores/map.store';
import { DEFAULT_MAP_CENTER } from '../../src/constants/map';
import type { Drop, MapDrop, NearbyDrop } from '../../src/types/drop.types';

/**
 * Main map screen — fullscreen GPS map with drop markers.
 */
function MapScreenContent(): React.JSX.Element {
  const hasGeoapifyKey = !!process.env.EXPO_PUBLIC_GEOAPIFY_KEY?.trim();
  const { coords, permissionStatus } = useLocation();
  const { drops, isLoading: dropsLoading } = useNearbyDrops();
  const { drops: globalDrops, isLoading: globalDropsLoading } = useGlobalDrops();
  const { selectDrop } = useMapStore();

  const [sheetDrop, setSheetDrop] = useState<NearbyDrop | null>(null);
  const [focusedDrop, setFocusedDrop] = useState<
    Pick<MapDrop, 'latitude' | 'longitude' | 'rarityTier'> | null
  >(null);

  const mapDrops: MapDrop[] = useMemo(() => {
    // 1. Map nearby drops natively into MapDrop format
    const nearbyMapped = drops.map((d) => ({
      id: d.id,
      latitude: d.latitude,
      longitude: d.longitude,
      rarityTier: d.rarityTier,
      isClaimable: d.isClaimable,
      currentClaims: d.currentClaims,
      maxClaims: d.maxClaims,
    }));

    // 2. Map global drops that aren't already in nearby list
    const nearbyIds = new Set(nearbyMapped.map((d) => d.id));
    const globalMapped = globalDrops
      .filter((d) => !nearbyIds.has(d.id))
      .map((d) => ({
        id: d.id,
        latitude: d.latitude,
        longitude: d.longitude,
        rarityTier: d.rarityTier,
        isClaimable: false, // global drops not near user can't be claimed yet
        currentClaims: d.currentClaims,
        maxClaims: d.maxClaims,
      }));

    return [...nearbyMapped, ...globalMapped];
  }, [drops, globalDrops]);

  const handleMarkerPress = useCallback(
    (dropId: string) => {
      const nearby = drops.find((d) => d.id === dropId);
      const global = globalDrops.find((d) => d.id === dropId);
      const compact = mapDrops.find((d) => d.id === dropId);

      if (compact) {
        if (nearby) {
          setSheetDrop(nearby);
        } else if (global) {
          // If it's a global drop not in nearby, create a dummy NearbyDrop for the UI
          setSheetDrop({
            ...global,
            distanceMeters: 999999, // dummy far distance
            isClaimable: false,
            alreadyClaimed: false,
          });
        }

        setFocusedDrop({
          latitude: compact.latitude,
          longitude: compact.longitude,
          rarityTier: compact.rarityTier,
        });
        selectDrop(compact);
      }
    },
    [drops, mapDrops, selectDrop],
  );

  const handleGlobalDropPress = useCallback(
    (drop: Drop) => {
      // By calling handleMarkerPress directly, it handles nearby vs global resolving
      // and sets the proper sheet drop and UI state.
      handleMarkerPress(drop.id);
    },
    [handleMarkerPress],
  );

  const handleSheetClose = useCallback(() => {
    setSheetDrop(null);
    selectDrop(null);
    setFocusedDrop(null);
  }, [selectDrop]);

  const mapCenter = useMemo(
    () => ({
      latitude: coords?.latitude ?? DEFAULT_MAP_CENTER.latitude,
      longitude: coords?.longitude ?? DEFAULT_MAP_CENTER.longitude,
    }),
    [coords?.latitude, coords?.longitude],
  );

  // Permission denied state
  if (permissionStatus === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📍</Text>
        <Text style={styles.permissionTitle}>Location Access Required</Text>
        <Text style={styles.permissionText}>
          LootDrop needs your location to show nearby drops.
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsLabel}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasGeoapifyKey) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Geoapify Key Missing</Text>
        <Text style={styles.permissionText}>
          Set EXPO_PUBLIC_GEOAPIFY_KEY in .env to render the map.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GeoapifyMap
        apiKey={process.env.EXPO_PUBLIC_GEOAPIFY_KEY ?? ''}
        center={mapCenter}
        drops={mapDrops}
        selectedDrop={focusedDrop}
        onDropPress={handleMarkerPress}
      />

      <SafeAreaView style={styles.sectionsContainer} edges={['top']}>
        <View style={styles.sectionsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Drops Nearby</Text>
            <Text style={styles.sectionCount}>{drops.length}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {drops.length > 0 ? (
              drops.map((drop) => (
                <TouchableOpacity
                  key={drop.id}
                  style={styles.chip}
                  onPress={() => handleMarkerPress(drop.id)}
                >
                  <Text style={styles.chipTitle} numberOfLines={1}>
                    {drop.title}
                  </Text>
                  <Text style={styles.chipMeta}>{Math.round(drop.distanceMeters)}m away</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No nearby drops right now</Text>
            )}
          </ScrollView>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Global Drops</Text>
            <Text style={styles.sectionCount}>{globalDrops.length}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {globalDropsLoading && globalDrops.length === 0 ? (
              <Text style={styles.emptyText}>Loading global drops...</Text>
            ) : globalDrops.length > 0 ? (
              globalDrops.map((drop) => (
                <TouchableOpacity
                  key={`global-${drop.id}`}
                  style={styles.chip}
                  onPress={() => handleGlobalDropPress(drop)}
                >
                  <Text style={styles.chipTitle} numberOfLines={1}>
                    {drop.title}
                  </Text>
                  <Text style={styles.chipMeta}>
                    {drop.latitude.toFixed(2)}, {drop.longitude.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No global drops available</Text>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Loading overlay */}
      {dropsLoading && !drops.length && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      )}

      {/* Drop count badge */}
      <SafeAreaView style={styles.badgeContainer} pointerEvents="none">
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {drops.length} drop{drops.length !== 1 ? 's' : ''} nearby
          </Text>
        </View>
      </SafeAreaView>

      {/* Drop detail sheet */}
      <DropDetailSheet
        drop={sheetDrop}
        isVisible={!!sheetDrop}
        onClose={handleSheetClose}
      />
    </View>
  );
}

export default function MapScreen(): React.JSX.Element {
  return (
    <WalletGuard>
      <MapScreenContent />
    </WalletGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  sectionsCard: {
    backgroundColor: 'rgba(10,10,15,0.86)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#A855F7',
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    width: 156,
    backgroundColor: 'rgba(30,41,59,0.65)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
  },
  chipTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  chipMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.22)',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(10,10,15,0.85)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionIcon: { fontSize: 48 },
  permissionTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  settingsButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  settingsLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
