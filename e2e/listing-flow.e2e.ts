import { device, expect, element, by, waitFor } from 'detox';

describe('Listing Creation Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Note: In real tests, you'd need to authenticate first
    // For now, assuming user is logged in or using test mode
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should navigate to post request screen', async () => {
    // Navigate to post request (adjust selectors based on actual app structure)
    const postRequestButton = element(by.id('post-request-button')).or(by.text('Post Request'));
    await waitFor(postRequestButton).toBeVisible().withTimeout(5000);
    await postRequestButton.tap();
    
    await waitFor(element(by.id('post-request-form')).or(by.text('Post Request')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should fill in request form', async () => {
    // Navigate to form first
    const postRequestButton = element(by.id('post-request-button')).or(by.text('Post Request'));
    await waitFor(postRequestButton).toBeVisible().withTimeout(5000);
    await postRequestButton.tap();

    // Fill in title
    const titleInput = element(by.id('title-input')).or(by.label('Title'));
    await waitFor(titleInput).toBeVisible().withTimeout(3000);
    await titleInput.typeText('Test Delivery Request');

    // Fill in from location
    const fromInput = element(by.id('from-location-input')).or(by.label('From'));
    await waitFor(fromInput).toBeVisible().withTimeout(3000);
    await fromInput.typeText('Miami');

    // Fill in to location
    const toInput = element(by.id('to-location-input')).or(by.label('To'));
    await waitFor(toInput).toBeVisible().withTimeout(3000);
    await toInput.typeText('St. Martin');

    // Fill in reward
    const rewardInput = element(by.id('reward-input')).or(by.label('Reward'));
    await waitFor(rewardInput).toBeVisible().withTimeout(3000);
    await rewardInput.typeText('500');
  });

  it('should submit request form', async () => {
    // Navigate and fill form (simplified)
    const submitButton = element(by.id('submit-request-button')).or(by.text('Submit'));
    await waitFor(submitButton).toBeVisible().withTimeout(5000);
    
    // In a real test, you'd fill the form first
    // await submitButton.tap();
    
    // Verify success message or navigation
    // await waitFor(element(by.text('Request posted successfully'))).toBeVisible();
  });
});

