/**
 * Mobile Debug Mode
 * Logs module resolution, React Native version, and TurboModule registry info
 */

import { Platform } from "react-native";

const DEBUG_MODE_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_DEBUG_MODE === "true";

interface ModuleResolutionInfo {
  moduleName: string;
  resolvedPath: string;
  version?: string;
}

interface DebugInfo {
  reactVersion: string;
  reactNativeVersion: string;
  platform: string;
  moduleResolutions: ModuleResolutionInfo[];
  turboModuleRegistry: string[];
}

class MobileDebugMode {
  private moduleResolutions: ModuleResolutionInfo[] = [];
  private turboModuleRegistry: string[] = [];

  logModuleResolution(
    moduleName: string,
    resolvedPath: string,
    version?: string
  ) {
    if (!DEBUG_MODE_ENABLED) return;

    const info: ModuleResolutionInfo = {
      moduleName,
      resolvedPath,
      version,
    };

    this.moduleResolutions.push(info);
    console.log(
      `[DEBUG] Module Resolution: ${moduleName} → ${resolvedPath}${version ? ` (v${version})` : ""}`
    );
  }

  logTurboModule(name: string) {
    if (!DEBUG_MODE_ENABLED) return;

    if (!this.turboModuleRegistry.includes(name)) {
      this.turboModuleRegistry.push(name);
      console.log(`[DEBUG] TurboModule Registered: ${name}`);
    }
  }

  getDebugInfo(): DebugInfo {
    try {
      const React = require("react");
      const ReactNative = require("react-native");

      return {
        reactVersion: React.version || "unknown",
        reactNativeVersion:
          ReactNative.Version?.major +
            "." +
            ReactNative.Version?.minor +
            "." +
            ReactNative.Version?.patch || "unknown",
        platform: Platform.OS,
        moduleResolutions: this.moduleResolutions,
        turboModuleRegistry: this.turboModuleRegistry,
      };
    } catch (error) {
      console.error("[DEBUG] Error getting debug info:", error);
      return {
        reactVersion: "error",
        reactNativeVersion: "error",
        platform: Platform.OS,
        moduleResolutions: this.moduleResolutions,
        turboModuleRegistry: this.turboModuleRegistry,
      };
    }
  }

  printDebugReport() {
    if (!DEBUG_MODE_ENABLED) return;

    const info = this.getDebugInfo();

    console.log("");
    console.log("========================================");
    console.log("📱 MOBILE DEBUG REPORT");
    console.log("========================================");
    console.log(`React Version: ${info.reactVersion}`);
    console.log(`React Native Version: ${info.reactNativeVersion}`);
    console.log(`Platform: ${info.platform}`);
    console.log("");
    console.log("Module Resolutions:");
    info.moduleResolutions.forEach((m) => {
      console.log(
        `  - ${m.moduleName}: ${m.resolvedPath}${m.version ? ` (v${m.version})` : ""}`
      );
    });
    console.log("");
    console.log("TurboModule Registry:");
    info.turboModuleRegistry.forEach((name) => {
      console.log(`  - ${name}`);
    });
    console.log("========================================");
    console.log("");
  }
}

export const mobileDebugMode = new MobileDebugMode();

// Auto-log React Native version on import
if (DEBUG_MODE_ENABLED) {
  try {
    const React = require("react");
    const ReactNative = require("react-native");

    console.log("[DEBUG] React Version:", React.version);
    console.log(
      "[DEBUG] React Native Version:",
      ReactNative.Version?.major +
        "." +
        ReactNative.Version?.minor +
        "." +
        ReactNative.Version?.patch
    );

    mobileDebugMode.logModuleResolution(
      "react",
      require.resolve("react"),
      React.version
    );
    mobileDebugMode.logModuleResolution(
      "react-native",
      require.resolve("react-native"),
      ReactNative.Version?.major +
        "." +
        ReactNative.Version?.minor +
        "." +
        ReactNative.Version?.patch
    );
  } catch (error) {
    console.error("[DEBUG] Error initializing debug mode:", error);
  }
}
