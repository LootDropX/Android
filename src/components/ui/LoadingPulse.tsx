import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface LoadingPulseProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton loader with a shimmer pulse animation.
 */
export function LoadingPulse({
  width = 200,
  height = 20,
  borderRadius = 8,
  style,
}: LoadingPulseProps): React.JSX.Element {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.pulse, { width, height, borderRadius }, animStyle, style]}
    />
  );
}

const styles = StyleSheet.create({
  pulse: {
    backgroundColor: '#1C1C2E',
  },
});
