import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

export interface ButtonProps extends TouchableOpacityProps {
  /** Text label for the button */
  label: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Shows a spinner and disables interaction when true */
  isLoading?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Themed button component with primary, ghost, and danger variants.
 * Supports loading state and press-scale animation.
 */
export function Button({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  onPress,
  style,
  ...rest
}: ButtonProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const isDisabled = disabled || isLoading;

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        animStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : '#7C3AED'}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  danger: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  ghostLabel: {
    color: '#7C3AED',
  },
  dangerLabel: {
    color: '#EF4444',
  },
});
