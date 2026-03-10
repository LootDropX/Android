const EARTH_RADIUS_M = 6_371_000;

/**
 * Calculates the great-circle distance between two GPS coordinates
 * using the Haversine formula.
 *
 * @param lat1 - Latitude of point 1 in decimal degrees
 * @param lng1 - Longitude of point 1 in decimal degrees
 * @param lat2 - Latitude of point 2 in decimal degrees
 * @param lng2 - Longitude of point 2 in decimal degrees
 * @returns Distance in metres
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Returns true if the user's coordinates are within `radiusMeters` of the
 * drop's coordinates.
 *
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param dropLat - Drop's latitude
 * @param dropLng - Drop's longitude
 * @param radiusMeters - Claim radius in metres
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  dropLat: number,
  dropLng: number,
  radiusMeters: number,
): boolean {
  return haversineDistance(userLat, userLng, dropLat, dropLng) <= radiusMeters;
}

