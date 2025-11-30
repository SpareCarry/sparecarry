declare module "@capacitor/preferences" {
  export interface PreferencesGetOptions {
    key: string;
  }

  export interface PreferencesSetOptions {
    key: string;
    value: string;
  }

  export interface PreferencesPlugin {
    get(options: PreferencesGetOptions): Promise<{ value: string | null }>;
    set(options: PreferencesSetOptions): Promise<void>;
  }

  export const Preferences: PreferencesPlugin;
}
