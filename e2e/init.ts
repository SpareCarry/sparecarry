import { device, expect, element, by, waitFor } from "detox";

beforeAll(async () => {
  await device.launchApp();
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  // Cleanup if needed
});
