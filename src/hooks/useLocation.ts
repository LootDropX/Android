import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '../stores/location.store';

export interface UseLocationReturn {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    heading: number | null;
    speed: number | null;
  } | null;
  permissionStatus: Location.PermissionStatus | null;
  isTracking: boolean;
  error: string | null;
}

/**
 * Tracks the device's GPS position using Expo Location.
 * Requests foreground permission on mount and streams updates via
 * a subscription. Updates the global `useLocationStore` on every
 * position change.
 *
 * @returns Current coords, permission status, tracking flag, and any error
 */
export function useLocation(): UseLocationReturn {
  const { coords, isTracking, setCoords, setTracking } = useLocationStore();
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const permissionStatusRef = useRef<Location.PermissionStatus | null>(null);
  const errorRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startTracking(): Promise<void> {
      const { status } = await Location.requestForegroundPermissionsAsync();
      permissionStatusRef.current = status;

      if (status !== Location.PermissionStatus.GRANTED) {
        errorRef.current =
          'Location permission denied. Enable it in Settings to find nearby drops.';
        setTracking(false);
        return;
      }

      if (cancelled) return;

      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5,
            timeInterval: 3000,
          },
          (location) => {
            setCoords({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              altitude: location.coords.altitude,
              heading: location.coords.heading,
              speed: location.coords.speed,
            });
          },
        );

        if (cancelled) {
          subscription.remove();
          return;
        }

        subscriptionRef.current = subscription;
        setTracking(true);
      } catch (err) {
        errorRef.current = `GPS error: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setTracking(false);
      }
    }

    startTracking();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setTracking(false);
    };
  }, [setCoords, setTracking]);

  return {
    coords,
    permissionStatus: permissionStatusRef.current,
    isTracking,
    error: errorRef.current,
  };
}
