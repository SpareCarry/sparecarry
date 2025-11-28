import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Load environment variables from .env file
  // Expo automatically loads .env files, but we can also access them here
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Warn if env vars are missing (but don't fail - let runtime handle it)
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Missing Supabase environment variables!');
    console.warn('   Create apps/mobile/.env with:');
    console.warn('   EXPO_PUBLIC_SUPABASE_URL=your_url');
    console.warn('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
  }

  return {
    ...config,
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
    assetBundlePatterns: ['**/*'],
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
          // Sounds are optional - comment out if files don't exist
          // sounds: [
          //   './assets/sounds/boat-horn.wav',
          //   './assets/sounds/airplane-ding.wav',
          //   './assets/sounds/foghorn.wav',
          // ],
        },
      ],
      'expo-secure-store',
      'expo-font',
    ],
    scheme: 'sparecarry',
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
      },
    },
  };
};

