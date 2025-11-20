import { device, expect, element, by, waitFor } from 'detox';

describe('App Launch', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should launch app successfully', async () => {
    await expect(element(by.id('app-root'))).toBeVisible();
  });

  it('should show home screen or login screen', async () => {
    // Wait for app to load
    await waitFor(element(by.id('home-screen')).or(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should have navigation working', async () => {
    // Check if navigation elements are present
    await waitFor(element(by.id('navigation')).or(by.text('SpareCarry')))
      .toBeVisible()
      .withTimeout(3000);
  });
});

