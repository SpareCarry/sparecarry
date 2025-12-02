module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Removed 'expo-router/babel' - it's deprecated in SDK 50+
      // babel-preset-expo already includes expo-router support
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@sparecarry/lib": "../../packages/lib",
            "@sparecarry/hooks": "../../packages/hooks",
            "@sparecarry/ui": "../../packages/ui",
            // Allow shared hooks to import the mobile Google Sign-In helper
            "@sparecarry/mobile/lib/auth/googleSignIn":
              "./lib/auth/googleSignIn",
          },
        },
      ],
    ],
  };
};
