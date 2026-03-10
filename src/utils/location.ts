export interface ParsedLocation {
  latitude: number;
  longitude: number;
}

function isValidCoordinatePair(longitude: number, latitude: number): boolean {
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function parseGeoJsonLocation(input: unknown): ParsedLocation | null {
  if (!input || typeof input !== 'object') return null;

  const candidate = input as { coordinates?: unknown };
  if (!Array.isArray(candidate.coordinates) || candidate.coordinates.length < 2) return null;

  const [longitude, latitude] = candidate.coordinates;
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return null;
  if (!isValidCoordinatePair(longitude, latitude)) return null;

  return { latitude, longitude };
}

function parseWktPoint(location: string): ParsedLocation | null {
  const match =
    /(?:SRID=\d+;)?POINT\s*\(\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s+([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s*\)/i.exec(
      location,
    );

  if (!match) return null;

  const longitude = parseFloat(match[1]);
  const latitude = parseFloat(match[2]);
  if (!isValidCoordinatePair(longitude, latitude)) return null;

  return { latitude, longitude };
}

function parseWkbPointHex(location: string): ParsedLocation | null {
  if (!/^[0-9a-f]+$/i.test(location) || location.length < 42 || location.length % 2 !== 0) {
    return null;
  }

  const bytes = new Uint8Array(location.length / 2);
  for (let i = 0; i < location.length; i += 2) {
    bytes[i / 2] = parseInt(location.slice(i, i + 2), 16);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  const byteOrder = view.getUint8(offset);
  offset += 1;
  if (byteOrder !== 0 && byteOrder !== 1) return null;

  const littleEndian = byteOrder === 1;
  let type = view.getUint32(offset, littleEndian);
  offset += 4;

  const hasSrid = (type & 0x20000000) !== 0;
  type &= 0x0fffffff;
  const geometryType = type % 1000;

  if (geometryType !== 1) return null;

  if (hasSrid) {
    if (offset + 4 > view.byteLength) return null;
    offset += 4;
  }

  if (offset + 16 > view.byteLength) return null;
  const longitude = view.getFloat64(offset, littleEndian);
  const latitude = view.getFloat64(offset + 8, littleEndian);
  if (!isValidCoordinatePair(longitude, latitude)) return null;

  return { latitude, longitude };
}

/**
 * Parses a PostGIS point from common Supabase/PostgREST encodings:
 * GeoJSON object/string, WKT/EWKT, and WKB/EWKB hex.
 */
export function parsePointLocation(location: unknown): ParsedLocation | null {
  const fromObject = parseGeoJsonLocation(location);
  if (fromObject) return fromObject;

  if (typeof location !== 'string') return null;
  const value = location.trim();
  if (!value) return null;

  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as unknown;
      const fromJson = parseGeoJsonLocation(parsed);
      if (fromJson) return fromJson;
    } catch {
      // ignore malformed JSON and continue with other decoders
    }
  }

  const fromWkt = parseWktPoint(value);
  if (fromWkt) return fromWkt;

  return parseWkbPointHex(value);
}
