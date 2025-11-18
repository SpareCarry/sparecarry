import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sparecarry.app",
  appName: "SpareCarry",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#14b8a6", // Teal color
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#ffffff",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#14b8a6",
      sound: "foghorn.wav",
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
  },
  ios: {
    scheme: "SpareCarry",
    contentInset: "automatic",
  },
};

export default config;

