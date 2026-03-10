import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RARITY_COLORS, RARITY_LABELS } from '../../constants/rarity';
import { RarityTier } from '../../types/drop.types';

export interface RarityBadgeProps {
  tier: RarityTier;
  size?: 'sm' | 'md';
}

/**
 * Pill badge displaying a drop's rarity tier with the appropriate color.
 */
export function RarityBadge({ tier, size = 'md' }: RarityBadgeProps): React.JSX.Element {
  const color = RARITY_COLORS[tier];
  const label = RARITY_LABELS[tier];

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        { backgroundColor: `${color}22`, borderColor: `${color}66` },
      ]}
    >
      <Text
        style={[styles.label, size === 'sm' && styles.labelSm, { color }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontSize: 11,
  },
});
