import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'LootDrop',
  slug: 'lootdrop',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A0F',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A0F',
    },
    package: 'com.lootdrop.app',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
    ],
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.lootdrop.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'LootDrop needs your location to show nearby drops on the map.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'LootDrop uses background location to alert you when drops are nearby.',
      NSCameraUsageDescription:
        'LootDrop uses the camera for claim animations.',
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'LootDrop uses background location to alert you when drops are nearby.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'LootDrop uses the camera for claim animations.',
      },
    ],
    'expo-font',
    'expo-secure-store',
    'expo-system-ui',
  ],
  scheme: 'lootdrop',
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/lootdrop',
  },
  runtimeVersion: "1.0.0",
  extra: {
    eas: {
      projectId: '34a29a00-35b0-4d1f-ab31-90df7aac649a',
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    avaxRpcUrl: process.env.EXPO_PUBLIC_AVAX_RPC_URL,
    contractAddress: process.env.EXPO_PUBLIC_CONTRACT_ADDRESS,
    geoapifyApiKey: process.env.EXPO_PUBLIC_GEOAPIFY_KEY,
  },
});
