import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Expo automatically loads .env/.env.local/.env.* files.
  // We don't log missing Supabase env vars here anymore to keep builds quiet;
  // the runtime code is responsible for handling misconfiguration gracefully.
  return {
    name: 'SpareCarry',
    slug: 'sparecarry',
    version: '0.1.0',
    // Use JSC for now to avoid current RN DevTools/Hermes incompatibility
    jsEngine: 'jsc',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#14b8a6',
    },
    assetBundlePatterns: [
      '**/*',
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.sparecarry.app',
      infoPlist: {
        NSCameraUsageDescription: 'SpareCarry needs camera access to take photos of items.',
        NSLocationWhenInUseUsageDescription: 'SpareCarry needs location access to find nearby trips and requests.',
        NSLocationAlwaysUsageDescription: 'SpareCarry needs location access to find nearby trips and requests.',
        NSPhotoLibraryUsageDescription: 'SpareCarry needs photo library access to select images.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png', // Use icon.png as fallback if adaptive-icon.png doesn't exist
        backgroundColor: '#14b8a6',
      },
      package: 'com.sparecarry.app',
      jsEngine: 'jsc',
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-dev-client',
      [
        'expo-build-properties',
        {
          android: {
            // expo-root-project / KSP expect Kotlin 2.x; 2.0.0 is a safe baseline
            kotlinVersion: '2.0.0',
          },
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'SpareCarry needs location access to find nearby trips and requests.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'SpareCarry needs camera access to take photos of items.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#14b8a6',
        },
      ],
    ],
    scheme: 'sparecarry',
    extra: {
      router: {
        origin: false,
      },
      eas: {
        // Must match the project.id in eas.json for EAS builds to work
        projectId: '252620b4-c84e-4dd5-9d76-31bfd5e22854',
      },
    },
  };
};

