/**
 * Shared setup for subscription flow tests
 * Ensures consistent test setup across all subscription tests
 */

import { Page } from '@playwright/test';
import { TestUser } from '../setup/testUserFactory';
import { enableTestMode } from '../setup/testModeSetup';

export async function setupSubscriptionTest(page: Page, user: TestUser, options?: {
  lifetimeAvailable?: boolean;
}) {
  const { lifetimeAvailable = true } = options || {};
  
  // Enable test mode for authentication
  await enableTestMode(page, user);
  
  // Mock lifetime availability data
  await page.route('**/rest/v1/rpc/get_lifetime_purchase_count**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ total: lifetimeAvailable ? 500 : 1000 }]),
    });
  });

  await page.route('**/rest/v1/rpc/get_lifetime_availability**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(lifetimeAvailable), // RPC returns boolean
    });
  });

  // Mock profile and user data using function matchers for reliability
  // Function matchers are more reliable than string patterns with query params
  await page.route((url) => {
    const href = typeof url === 'string' ? url : url.href;
    return href.includes('/rest/v1/profiles');
  }, async (route) => {
    const request = route.request();
    const isLifetime = user.profile?.lifetime_active === true || user.userData?.lifetime_pro === true;
    
    const responseBody = [{
      ...(user.profile || {}),
      user_id: user.id,
      phone: user.phone || user.profile?.phone || null,
      verified_sailor_at: user.profile?.verified_sailor_at || null,
      stripe_identity_verified_at: user.profile?.stripe_identity_verified_at || null,
      lifetime_active: isLifetime,
      lifetime_purchase_at: isLifetime ? new Date().toISOString() : null,
      stripe_customer_id: user.profile?.stripe_customer_id || null,
    }];
    
    console.log(`[SETUP_SUBSCRIPTION_TEST] ✓ Intercepted ${request.method()} ${request.url()}`);
    console.log(`[SETUP_SUBSCRIPTION_TEST] Response: isLifetime=${isLifetime}, lifetime_active=${responseBody[0].lifetime_active}`);
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': '0-0/1',
      },
      body: JSON.stringify(responseBody),
    });
  });

  await page.route((url) => {
    const href = typeof url === 'string' ? url : url.href;
    return href.includes('/rest/v1/users') && !href.includes('/rest/v1/users_count');
  }, async (route) => {
    const request = route.request();
    const isLifetime = user.userData?.lifetime_pro === true;
    const hasSubscription = user.userData?.subscription_status === 'active';
    
    const responseBody = [{
      ...(user.userData || {}),
      id: user.id,
      email: user.email,
      role: user.role || 'requester',
      subscription_status: hasSubscription ? 'active' : null,
      subscription_current_period_end: null,
      supporter_status: user.userData?.supporter_status || null,
      supporter_expires_at: null,
      lifetime_pro: isLifetime,
      lifetime_pro_purchased_at: isLifetime ? new Date().toISOString() : null,
      stripe_customer_id: user.userData?.stripe_customer_id || null,
    }];
    
    console.log(`[SETUP_SUBSCRIPTION_TEST] ✓ Intercepted ${request.method()} ${request.url()}`);
    console.log(`[SETUP_SUBSCRIPTION_TEST] Response: lifetime_pro=${responseBody[0].lifetime_pro}, subscription_status=${responseBody[0].subscription_status}`);
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': '0-0/1',
      },
      body: JSON.stringify(responseBody),
    });
  });
  
  // Wait a moment to ensure routes are registered
  await page.waitForTimeout(100);
}

