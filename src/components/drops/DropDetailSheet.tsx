import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { RarityBadge } from './RarityBadge';
import { useClaimDrop } from '../../hooks/useClaimDrop';
import { useDropProximity } from '../../hooks/useDropProximity';
import { useLocationStore } from '../../stores/location.store';
import { formatSOL, formatExpiry, formatPublicKey, formatClaimsLeft } from '../../utils/format';
import { AssetType } from '../../types/drop.types';
import type { NearbyDrop } from '../../types/drop.types';

export interface DropDetailSheetProps {
  drop: NearbyDrop | null;
  isVisible: boolean;
  onClose: () => void;
}

const CLAIM_STATE_LABELS: Record<string, string> = {
  validating: 'Checking eligibility…',
  building_tx: 'Building transaction…',
  awaiting_signature: 'Waiting for wallet…',
  confirming: 'Confirming on-chain…',
  success: 'Claimed!',
  error: 'Something went wrong',
};

/**
 * Bottom sheet displaying drop details and the claim action.
 */
export function DropDetailSheet({
  drop,
  isVisible,
  onClose,
}: DropDetailSheetProps): React.JSX.Element | null {
  const coords = useLocationStore((s) => s.coords);
  const { claim, claimState, error } = useClaimDrop();

  const proximity = useDropProximity(
    drop ?? ({} as NearbyDrop),
    drop ? coords : null,
  );

  if (!drop) return null;

  const isClaiming = !['idle', 'success', 'error'].includes(claimState);

  const rewardText =
    drop.assetType === AssetType.SOL
      ? formatSOL(drop.assetAmount)
      : drop.assetType === AssetType.NFT
        ? 'NFT'
        : `${drop.assetAmount} SKR`;

  const claimButtonLabel = (() => {
    if (claimState === 'success') return 'Claimed! View in inventory →';
    if (!proximity.isInClaimRange)
      return `Get within range • ${proximity.proximityMessage}`;
    return 'Claim';
  })();

  return (
    <Sheet isVisible={isVisible} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{drop.title}</Text>
            <RarityBadge tier={drop.rarityTier} />
          </View>
          <Text style={styles.creator}>By {formatPublicKey(drop.creator)}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rewardText}</Text>
            <Text style={styles.statLabel}>Reward</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatClaimsLeft(drop.currentClaims, drop.maxClaims)}
            </Text>
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

        {isClaiming && (
          <View style={styles.progressRow}>
            <ActivityIndicator color="#7C3AED" size="small" />
            <Text style={styles.progressText}>
              {CLAIM_STATE_LABELS[claimState] ?? claimState}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {error.code === 'OUT_OF_RANGE'
                ? `Too far away — move closer (${Math.round('distanceMeters' in error ? error.distanceMeters : 0)}m)`
                : error.code.replace(/_/g, ' ')}
            </Text>
          </View>
        )}

        <Button
          label={claimButtonLabel}
          variant={claimState === 'success' ? 'ghost' : 'primary'}
          isLoading={isClaiming}
          disabled={
            !proximity.isInClaimRange ||
            claimState === 'success' ||
            drop.alreadyClaimed
          }
          onPress={() => claim(drop)}
          style={styles.claimButton}
        />

        {drop.alreadyClaimed && (
          <Text style={styles.alreadyClaimed}>You've already claimed this drop.</Text>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  creator: {
    color: '#94A3B8',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    color: '#475569',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  progressText: {
    color: '#A855F7',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  claimButton: {
    marginTop: 8,
  },
  alreadyClaimed: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
  },
});
