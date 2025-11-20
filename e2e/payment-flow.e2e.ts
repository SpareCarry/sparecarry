import { device, expect, element, by, waitFor } from 'detox';

describe('Payment Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show payment button in chat', async () => {
    // Navigate to chat (simplified)
    const paymentButton = element(by.id('payment-button')).or(by.text('Pay'));
    await waitFor(paymentButton).toBeVisible().withTimeout(10000);
  });

  it('should open payment screen', async () => {
    // Navigate to chat and tap payment button
    const paymentButton = element(by.id('payment-button')).or(by.text('Pay'));
    await waitFor(paymentButton).toBeVisible().withTimeout(10000);
    await paymentButton.tap();
    
    // Verify payment screen or Stripe checkout
    await waitFor(
      element(by.id('payment-screen'))
        .or(by.text('Payment'))
        .or(by.text('Stripe'))
    ).toBeVisible().withTimeout(5000);
  });

  it('should display payment amount', async () => {
    // Navigate to payment screen
    const paymentButton = element(by.id('payment-button')).or(by.text('Pay'));
    await waitFor(paymentButton).toBeVisible().withTimeout(10000);
    await paymentButton.tap();
    
    // Verify amount is displayed
    await waitFor(element(by.id('payment-amount')).or(by.text('$')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should handle payment confirmation (stubbed)', async () => {
    // In a real test, this would interact with Stripe
    // For now, we'll just verify the flow exists
    const paymentButton = element(by.id('payment-button')).or(by.text('Pay'));
    await waitFor(paymentButton).toBeVisible().withTimeout(10000);
    
    // Note: Actual payment processing would be stubbed or use test mode
    // This test verifies the UI flow exists
  });
});

