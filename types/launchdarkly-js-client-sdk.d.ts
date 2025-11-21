declare module 'launchdarkly-js-client-sdk' {
  export interface LDUser {
    key: string;
    email?: string;
    name?: string;
    anonymous?: boolean;
    custom?: Record<string, unknown>;
  }

  export interface LDOptions {
    bootstrap?: unknown;
    streaming?: boolean;
    pollingInterval?: number;
    [key: string]: unknown;
  }

  export interface LDClient {
    waitForInitialization(): Promise<void>;
    close(): void;
    allFlags(): Record<string, unknown>;
    variation<T = boolean>(flagKey: string, defaultValue: T): T;
    on(event: string, handler: (...args: unknown[]) => void): void;
  }

  export function initialize(
    clientSideId: string,
    user: LDUser,
    options?: LDOptions
  ): LDClient;

  export { LDClient };
}

