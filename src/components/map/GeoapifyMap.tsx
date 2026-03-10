import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { CLAIM_RADIUS, RARITY_COLORS } from '../../constants/rarity';
import type { MapDrop } from '../../types/drop.types';

type FocusedDrop = Pick<MapDrop, 'latitude' | 'longitude' | 'rarityTier'>;

interface GeoapifyMapProps {
  apiKey: string;
  center: { latitude: number; longitude: number };
  drops: MapDrop[];
  selectedDrop: FocusedDrop | null;
  onDropPress: (dropId: string) => void;
}

interface WebMessage {
  type: 'drop_press';
  id: string;
}

interface SerializedDrop {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  isClaimable: boolean;
}

/**
 * WebView map powered by Leaflet + Geoapify raster tiles.
 * Uses postMessage to forward marker taps back to React Native.
 */
export function GeoapifyMap({
  apiKey,
  center,
  drops,
  selectedDrop,
  onDropPress,
}: GeoapifyMapProps): React.JSX.Element {
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    if (webviewRef.current && selectedDrop) {
      const radius = CLAIM_RADIUS[selectedDrop.rarityTier];
      const color = RARITY_COLORS[selectedDrop.rarityTier];
      webviewRef.current.injectJavaScript(`
        if (window.flyToDrop) {
          window.flyToDrop(${selectedDrop.latitude}, ${selectedDrop.longitude}, ${radius}, '${color}');
        }
        true;
      `);
    }
  }, [selectedDrop]);
  const html = useMemo(() => {
    const serializedDrops: SerializedDrop[] = drops.map((drop) => ({
      id: drop.id,
      latitude: drop.latitude,
      longitude: drop.longitude,
      color: RARITY_COLORS[drop.rarityTier],
      isClaimable: drop.isClaimable,
    }));

    const payload = {
      apiKey,
      center,
      drops: serializedDrops,
      selectedDrop: selectedDrop
        ? {
          latitude: selectedDrop.latitude,
          longitude: selectedDrop.longitude,
          radius: CLAIM_RADIUS[selectedDrop.rarityTier],
          color: RARITY_COLORS[selectedDrop.rarityTier],
        }
        : null,
    };

    const payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c');

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      crossorigin=""
    />
    <style>
      html, body, #map {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #0A0A0F;
      }
      .drop-marker {
        width: 16px;
        height: 16px;
        border-radius: 9999px;
        border: 2px solid #fff;
        box-shadow: 0 0 0 1px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.45);
      }
      .drop-marker.claimable {
        width: 20px;
        height: 20px;
        box-shadow: 0 0 0 2px rgba(255,255,255,.65), 0 4px 12px rgba(0,0,0,.45);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const payload = ${payloadJson};

      const map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([payload.center.latitude, payload.center.longitude], 15);

      L.tileLayer(
        'https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=' + payload.apiKey,
        {
          maxZoom: 20,
          minZoom: 3
        }
      ).addTo(map);

      L.circleMarker([payload.center.latitude, payload.center.longitude], {
        radius: 7,
        fillColor: '#22D3EE',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 0.95
      }).addTo(map);

      payload.drops.forEach((drop) => {
        const className = drop.isClaimable ? 'drop-marker claimable' : 'drop-marker';
        const icon = L.divIcon({
          html: '<div class="' + className + '" style="background:' + drop.color + ';"></div>',
          iconSize: drop.isClaimable ? [20, 20] : [16, 16],
          className: ''
        });

        const marker = L.marker([drop.latitude, drop.longitude], { icon }).addTo(map);
        marker.on('click', () => {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'drop_press', id: drop.id })
            );
          }
        });
      });

      if (payload.selectedDrop) {
        L.circle(
          [payload.selectedDrop.latitude, payload.selectedDrop.longitude],
          {
            radius: payload.selectedDrop.radius,
            color: payload.selectedDrop.color,
            weight: 1.5,
            fillColor: payload.selectedDrop.color,
            fillOpacity: 0.15
          }
        ).addTo(map);
        map.setView([payload.selectedDrop.latitude, payload.selectedDrop.longitude], 16);
      }

      if (!payload.selectedDrop && payload.drops.length > 0) {
        const points = payload.drops.map((drop) => [drop.latitude, drop.longitude]);
        points.push([payload.center.latitude, payload.center.longitude]);
        map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
      }

      // Add a function to fly to a drop without reloading
      window.flyToDrop = (lat, lng, radius, color) => {
        if (window.selectedCircle) {
           map.removeLayer(window.selectedCircle);
        }
        window.selectedCircle = L.circle([lat, lng], {
            radius: radius,
            color: color,
            weight: 1.5,
            fillColor: color,
            fillOpacity: 0.15
        }).addTo(map);
        map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
      };

    </script>
  </body>
</html>`;
  }, [apiKey, center, drops]); // Remove selectedDrop from dependency to prevent full reload

  const handleMessage = (event: WebViewMessageEvent): void => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as WebMessage;
      if (data.type === 'drop_press' && typeof data.id === 'string') {
        onDropPress(data.id);
      }
    } catch {
      // Ignore malformed bridge messages.
    }
  };

  return (
    <WebView
      ref={webviewRef}
      source={{ html }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      onMessage={handleMessage}
      style={styles.map}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
});
