/** Base32 character set used in geohash encoding */
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encodes a latitude/longitude pair into a geohash string.
 *
 * @param lat - Latitude in decimal degrees (-90 to 90)
 * @param lng - Longitude in decimal degrees (-180 to 180)
 * @param precision - Number of characters in the result (default: 7)
 * @returns Geohash string
 */
export function encode(lat: number, lng: number, precision = 7): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        idx = idx * 2 + 1;
        lngMin = lngMid;
      } else {
        idx = idx * 2;
        lngMax = lngMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = idx * 2 + 1;
        latMin = latMid;
      } else {
        idx = idx * 2;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Decodes a geohash string back to a latitude/longitude with error margins.
 *
 * @param geohash - The geohash string to decode
 * @returns Object with lat, lng, and error margins
 */
export function decode(geohash: string): {
  lat: number;
  lng: number;
  error: { lat: number; lng: number };
} {
  let evenBit = true;
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  for (const char of geohash) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) throw new Error(`Invalid geohash character: ${char}`);

    for (let bits = 4; bits >= 0; bits--) {
      const bitN = (idx >> bits) & 1;
      if (evenBit) {
        const lngMid = (lngMin + lngMax) / 2;
        if (bitN === 1) lngMin = lngMid;
        else lngMax = lngMid;
      } else {
        const latMid = (latMin + latMax) / 2;
        if (bitN === 1) latMin = latMid;
        else latMax = latMid;
      }
      evenBit = !evenBit;
    }
  }

  return {
    lat: (latMin + latMax) / 2,
    lng: (lngMin + lngMax) / 2,
    error: {
      lat: (latMax - latMin) / 2,
      lng: (lngMax - lngMin) / 2,
    },
  };
}

/**
 * Returns the 8 neighbouring geohash cells surrounding the given cell.
 *
 * @param geohash - The center geohash
 * @returns Array of 8 neighbour geohash strings
 */
export function neighbors(geohash: string): string[] {
  const { lat, lng } = decode(geohash);
  const precision = geohash.length;

  // Approximate cell size at this precision
  const { error } = decode(geohash);
  const latStep = error.lat * 2;
  const lngStep = error.lng * 2;

  const directions = [
    [1, 0],   // N
    [1, 1],   // NE
    [0, 1],   // E
    [-1, 1],  // SE
    [-1, 0],  // S
    [-1, -1], // SW
    [0, -1],  // W
    [1, -1],  // NW
  ];

  return directions.map(([dLat, dLng]) =>
    encode(
      Math.max(-90, Math.min(90, lat + latStep * dLat)),
      Math.max(-180, Math.min(180, lng + lngStep * dLng)),
      precision,
    ),
  );
}
