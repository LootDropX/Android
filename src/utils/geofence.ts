import { haversineDistance } from './distance';

/**
 * Checks whether a GPS point falls within a circular geofence.
 *
 * @param pointLat - Latitude of the point to test
 * @param pointLng - Longitude of the point to test
 * @param centerLat - Latitude of the geofence center
 * @param centerLng - Longitude of the geofence center
 * @param radiusMeters - Radius of the geofence in metres
 * @returns true if the point is inside the geofence
 */
export function isInsideGeofence(
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): boolean {
  const dist = haversineDistance(pointLat, pointLng, centerLat, centerLng);
  return dist <= radiusMeters;
}
