declare module '@capacitor/core' {
  export const Capacitor: {
    isNativePlatform?: () => boolean;
    platform?: string;
    Plugins?: Record<string, any>;
    [key: string]: any;
  };
  export type PluginListenerHandle = {
    remove: () => Promise<void> | void;
  };
}

declare module '@capacitor/app' {
  export const App: {
    addListener: (event: string, callback: (...args: any[]) => void) => Promise<{ remove: () => void }> | { remove: () => void };
    removeListener?: (event: string, callback: (...args: any[]) => void) => Promise<void> | void;
  };
}

declare module '@capacitor/preferences' {
  export const Preferences: {
    get: (options: { key: string }) => Promise<{ value: string | null }>;
    set: (options: { key: string; value: string }) => Promise<void>;
    remove: (options: { key: string }) => Promise<void>;
    clear: () => Promise<void>;
  };
}

declare module '@capacitor/push-notifications' {
  export const PushNotifications: {
    addListener: (event: string, callback: (...args: any[]) => void) => Promise<{ remove: () => void }> | { remove: () => void };
    requestPermissions: () => Promise<{ receive: 'granted' | 'denied' }>;
    register: () => Promise<void>;
    getDeliveredNotifications?: () => Promise<any>;
  };
}

declare module '@capacitor/local-notifications' {
  export const LocalNotifications: {
    schedule: (options: any) => Promise<void>;
    requestPermissions: () => Promise<{ display: 'granted' | 'denied' }>;
  };
}

declare module '@capacitor/haptics' {
  export const Haptics: {
    impact: (options: any) => Promise<void>;
    notification: (options: any) => Promise<void>;
    selectionStart?: () => Promise<void>;
    selectionChanged?: () => Promise<void>;
    selectionEnd?: () => Promise<void>;
  };
  export const ImpactStyle: Record<string, any>;
}

