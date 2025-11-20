import { device, expect, element, by, waitFor } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display login screen', async () => {
    await waitFor(element(by.id('login-screen')).or(by.text('Welcome to CarrySpace')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show email input field', async () => {
    await waitFor(element(by.id('email-input')).or(by.label('Email')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should allow entering email', async () => {
    const emailInput = element(by.id('email-input')).or(by.label('Email'));
    await waitFor(emailInput).toBeVisible().withTimeout(3000);
    await emailInput.typeText('test@example.com');
    await expect(emailInput).toHaveText('test@example.com');
  });

  it('should show magic link button', async () => {
    await waitFor(element(by.id('magic-link-button')).or(by.text('Send Magic Link')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate to signup screen', async () => {
    const signupLink = element(by.id('signup-link')).or(by.text('Sign up'));
    await waitFor(signupLink).toBeVisible().withTimeout(3000);
    await signupLink.tap();
    await waitFor(element(by.id('signup-screen')).or(by.text('Sign up')))
      .toBeVisible()
      .withTimeout(3000);
  });
});

