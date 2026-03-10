import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ClaimZoneIndicatorProps {
  /** Whether the user is currently inside a claim zone */
  isInZone: boolean;
  /** Human-readable proximity message */
  message: string;
}

/**
 * Floating indicator that shows when the user enters a claim zone.
 */
export function ClaimZoneIndicator({
  isInZone,
  message,
}: ClaimZoneIndicatorProps): React.JSX.Element | null {
  if (!isInZone) return null;

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  text: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
});
