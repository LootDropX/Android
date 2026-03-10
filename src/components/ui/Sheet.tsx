import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export interface SheetProps {
  children: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  snapPoints?: string[];
}

/**
 * A simple animated bottom sheet wrapper using react-native-reanimated.
 * Supports dragging down to close.
 */
export function Sheet({ children, isVisible, onClose }: SheetProps): React.JSX.Element | null {
  const translateY = useSharedValue(300);

  React.useEffect(() => {
    translateY.value = withSpring(isVisible ? 0 : 300, { damping: 20 });
  }, [isVisible, translateY]);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100) {
        translateY.value = withSpring(300, { damping: 20 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.sheet, useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    minHeight: '40%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
});
