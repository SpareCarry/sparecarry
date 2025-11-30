/**
 * Type declaration for expo-constants (optional dependency)
 * This allows TypeScript to understand the module even when it's not installed
 */
declare module "expo-constants" {
  export interface ExpoConfig {
    extra?: {
      eas?: {
        projectId?: string;
      };
    };
  }

  export interface Constants {
    expoConfig?: ExpoConfig | null;
  }

  const Constants: Constants;
  export default Constants;
}
