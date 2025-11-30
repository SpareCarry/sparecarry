// apps/mobile/index.js
// Custom entry that instruments React / AppRegistry and then forwards to expo-router

// Basic guard to see how often the entry file itself is evaluated
if (global.__SPARECARRY_ENTRY_LOAD_COUNT__ == null) {
  global.__SPARECARRY_ENTRY_LOAD_COUNT__ = 0;
}
global.__SPARECARRY_ENTRY_LOAD_COUNT__ += 1;
console.log(
  "[ENTRY] apps/mobile/index.js evaluated. Count =",
  global.__SPARECARRY_ENTRY_LOAD_COUNT__
);

// Instrument AppRegistry to detect duplicate root registrations
try {
  const { AppRegistry } = require("react-native");

  if (!global.__SPARECARRY_APPREGISTRY_PATCHED__) {
    global.__SPARECARRY_APPREGISTRY_PATCHED__ = true;
    const originalRegisterComponent =
      AppRegistry.registerComponent.bind(AppRegistry);

    AppRegistry.registerComponent = (appKey, componentProvider) => {
      if (!global.__SPARECARRY_APPREGISTRY_CALLS__) {
        global.__SPARECARRY_APPREGISTRY_CALLS__ = [];
      }

      global.__SPARECARRY_APPREGISTRY_CALLS__.push(appKey);
      console.log(
        "[ENTRY] AppRegistry.registerComponent called for appKey =",
        appKey,
        "totalCalls =",
        global.__SPARECARRY_APPREGISTRY_CALLS__.length
      );

      return originalRegisterComponent(appKey, componentProvider);
    };

    console.log("[ENTRY] AppRegistry.registerComponent instrumentation active");
  }
} catch (e) {
  console.warn(
    "[ENTRY] Failed to instrument AppRegistry.registerComponent:",
    e?.message ?? e
  );
}

// Finally, hand off to expo-router's standard entry
import "expo-router/entry";
