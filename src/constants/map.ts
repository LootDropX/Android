/** Default map center (San Francisco) */
export const DEFAULT_MAP_CENTER = {
  latitude: 37.7749,
  longitude: -122.4194,
} as const;

/** Default map zoom delta */
export const DEFAULT_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
} as const;

/** Radius (meters) used when querying nearby drops */
export const NEARBY_DROPS_RADIUS_M = 2000;

/** Polling interval for nearby drops (ms) */
export const NEARBY_DROPS_POLL_MS = 30_000;

/** GPS distance interval for location updates (meters) */
export const GPS_DISTANCE_INTERVAL_M = 5;

/** Debounce delay for map region changes (ms) */
export const MAP_REGION_DEBOUNCE_MS = 300;
