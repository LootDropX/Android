import { create } from 'zustand';
import type { MapDrop } from '../types/drop.types';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapState {
  /** Currently selected drop (for bottom sheet) */
  selectedDrop: MapDrop | null;
  /** Current map viewport */
  region: MapRegion | null;
  /** Whether developer mode GPS override is active */
  devModeEnabled: boolean;
  /** Fake GPS coordinates used in dev mode */
  devModeCoords: { latitude: number; longitude: number } | null;
  /** Select a drop to show in the detail sheet */
  selectDrop: (drop: MapDrop | null) => void;
  /** Update the map region */
  setRegion: (region: MapRegion) => void;
  /** Toggle developer mode */
  toggleDevMode: () => void;
  /** Set dev mode fake coordinates */
  setDevModeCoords: (coords: { latitude: number; longitude: number }) => void;
}

/**
 * Zustand store for map viewport and selected drop state.
 */
export const useMapStore = create<MapState>((set) => ({
  selectedDrop: null,
  region: null,
  devModeEnabled: false,
  devModeCoords: null,
  selectDrop: (drop) => set({ selectedDrop: drop }),
  setRegion: (region) => set({ region }),
  toggleDevMode: () => set((state) => ({ devModeEnabled: !state.devModeEnabled })),
  setDevModeCoords: (coords) => set({ devModeCoords: coords }),
}));
