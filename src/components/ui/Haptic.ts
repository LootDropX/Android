import * as Haptics from 'expo-haptics';

/**
 * Triggers a light haptic tap (e.g., on button press).
 */
export async function hapticLight(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Triggers a medium haptic tap.
 */
export async function hapticMedium(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Triggers a heavy haptic tap.
 */
export async function hapticHeavy(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Triggers the success haptic pattern (double pulse).
 */
export async function hapticSuccess(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Triggers the error haptic pattern.
 */
export async function hapticError(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
