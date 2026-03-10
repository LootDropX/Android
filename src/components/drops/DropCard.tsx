import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { RarityBadge } from './RarityBadge';
import { LoadingPulse } from '../ui/LoadingPulse';
import { formatExpiry } from '../../utils/format';
import type { InventoryItem } from '../../types/nft.types';
import { RarityTier } from '../../types/drop.types';

export interface DropCardProps {
  item: InventoryItem;
  onPress: (item: InventoryItem) => void;
}

/**
 * Grid card for an inventory item (claimed NFT or SOL drop).
 */
export function DropCard({ item, onPress }: DropCardProps): React.JSX.Element {
  const [imageLoaded, setImageLoaded] = React.useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {!imageLoaded && <LoadingPulse width={140} height={140} style={styles.skeleton} />}
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={[styles.image, !imageLoaded && styles.hidden]}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>🎁</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <RarityBadge tier={(item.rarityTier as RarityTier) ?? RarityTier.COMMON} size="sm" />
        {item.claimedAt && (
          <Text style={styles.date}>
            {new Date(item.claimedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flex: 1,
    margin: 6,
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#1C1C2E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
  skeleton: {
    position: 'absolute',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
  },
  content: {
    padding: 12,
    gap: 6,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    color: '#475569',
    fontSize: 11,
    marginTop: 2,
  },
});
