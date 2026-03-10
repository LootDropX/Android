import { create } from 'zustand';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
}

export interface LocationState {
  /** Current GPS coordinates, or null if unavailable */
  coords: Coords | null;
  /** Whether GPS tracking is active */
  isTracking: boolean;
  /** Update the current coordinates */
  setCoords: (coords: Coords) => void;
  /** Set the tracking status */
  setTracking: (isTracking: boolean) => void;
}

/**
 * Zustand store for the device's current GPS position.
 */
export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  isTracking: false,
  setCoords: (coords) => set({ coords }),
  setTracking: (isTracking) => set({ isTracking }),
}));
