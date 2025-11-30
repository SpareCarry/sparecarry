/**
 * Comprehensive Supabase Endpoint Mocks
 *
 * Mocks all Supabase endpoints for complete E2E test coverage:
 * - Authentication (OTP, user, token)
 * - REST API (users, profiles, trips, requests, matches, messages)
 * - Stripe checkout sessions
 * - RPC functions
 */

import { Page } from "@playwright/test";

type RestTable =
  | "users"
  | "profiles"
  | "trips"
  | "requests"
  | "matches"
  | "conversations"
  | "messages"
  | "disputes";

type TestData = Partial<Record<RestTable, any[]>>;

function createDefaultTestData(): Required<TestData> {
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const users = [
    {
      id: "user-1",
      email: "traveler@example.com",
      role: "traveler",
      stripe_customer_id: "cus_test_traveler",
      subscription_status: null,
      subscription_current_period_end: null,
      supporter_status: null,
      supporter_purchased_at: null,
      supporter_expires_at: null,
      referral_code: "TRAVELER1",
      referred_by: null,
      referral_credits: 0,
      completed_deliveries_count: 5,
      average_rating: 4.5,
      total_referrals_count: 0,
      karma_points: 120,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: "user-2",
      email: "requester@example.com",
      role: "requester",
      stripe_customer_id: "cus_test_requester",
      subscription_status: "active",
      subscription_current_period_end: twoWeeks.toISOString(),
      supporter_status: null,
      supporter_purchased_at: null,
      supporter_expires_at: null,
      referral_code: "REQUESTER1",
      referred_by: null,
      referral_credits: 50,
      completed_deliveries_count: 2,
      average_rating: 4.8,
      total_referrals_count: 1,
      karma_points: 60,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  const profiles = [
    {
      id: "profile-1",
      user_id: "user-1",
      phone: "+15555555555",
      full_name: "Test Traveler",
      verified_identity: true,
      verified_sailor: false,
      stripe_account_id: "acct_test_123",
      stripe_verification_session_id: null,
      stripe_identity_verified_at: now.toISOString(),
      verified_sailor_at: null,
      boat_name: null,
      boat_type: null,
      boat_length_ft: null,
      verified_at: now.toISOString(),
      bio: "Traveler bio",
      avatar_url: null,
      expo_push_token: "ExponentPushToken[test-token-1]",
      push_notifications_enabled: true,
      shipping_name: "Traveler One",
      shipping_address_line1: "123 Ocean Ave",
      shipping_address_line2: null,
      shipping_city: "Miami",
      shipping_state: "FL",
      shipping_postal_code: "33101",
      shipping_country: "USA",
      lifetime_active: false,
      lifetime_purchase_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: "profile-2",
      user_id: "user-2",
      phone: "+16666666666",
      full_name: "Test Requester",
      verified_identity: true,
      verified_sailor: false,
      stripe_account_id: null,
      stripe_verification_session_id: null,
      stripe_identity_verified_at: now.toISOString(),
      verified_sailor_at: null,
      boat_name: null,
      boat_type: null,
      boat_length_ft: null,
      verified_at: now.toISOString(),
      bio: "Requester bio",
      avatar_url: null,
      expo_push_token: "ExponentPushToken[test-token-2]",
      push_notifications_enabled: true,
      shipping_name: "Requester One",
      shipping_address_line1: "987 Marina Blvd",
      shipping_address_line2: null,
      shipping_city: "St. Martin",
      shipping_state: null,
      shipping_postal_code: "12345",
      shipping_country: "Antilles",
      lifetime_active: false,
      lifetime_purchase_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  const trips = [
    {
      id: "trip-1",
      user_id: "user-1",
      type: "plane",
      from_location: "Miami, FL",
      to_location: "St. Martin",
      departure_date: oneWeek.toISOString(),
      arrival_date: twoWeeks.toISOString(),
      eta_window_start: oneWeek.toISOString(),
      eta_window_end: twoWeeks.toISOString(),
      spare_kg: 20,
      spare_volume_liters: 50,
      max_dimensions: JSON.stringify({
        length_cm: 80,
        width_cm: 60,
        height_cm: 40,
      }),
      can_oversize: false,
      status: "active",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  const requests = [
    {
      id: "request-1",
      user_id: "user-2",
      title: "Deliver rigging hardware",
      description: "Need parts delivered to St. Martin marina",
      from_location: "Miami, FL",
      to_location: "St. Martin",
      deadline_latest: twoWeeks.toISOString(),
      preferred_method: "any",
      max_reward: 500,
      weight_kg: 10,
      length_cm: 50,
      width_cm: 40,
      height_cm: 30,
      value_usd: 300,
      emergency: false,
      status: "open",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  const matches = [
    {
      id: "match-1",
      trip_id: "trip-1",
      request_id: "request-1",
      status: "chatting",
      reward_amount: 500,
      platform_fee_percent: 0.15,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      trips: trips[0],
      requests: requests[0],
      deliveries: [
        {
          dispute_opened_at: null,
          delivered_at: null,
        },
      ],
    },
  ];

  const conversations: any[] = [];
  const messages: any[] = [];
  const disputes: any[] = [];

  return {
    users,
    profiles,
    trips,
    requests,
    matches,
    conversations,
    messages,
    disputes,
  };
}

function cloneDataStore(overrides: TestData = {}): Required<TestData> {
  const defaults = createDefaultTestData();
  const tables = Object.keys(defaults) as RestTable[];
  const result = {} as Required<TestData>;
  tables.forEach((table) => {
    const override = overrides[table];
    result[table] = override
      ? override.map((item) => ({ ...item }))
      : defaults[table].map((item) => ({ ...item }));
  });
  return result;
}

function extractTable(pathname: string): RestTable | null {
  const match = pathname.match(/\/rest\/v1\/([^/?]+)/);
  if (!match) return null;
  const table = decodeURIComponent(match[1]) as RestTable;
  return table || null;
}

function normalizeValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function filterRows(rows: any[], params: URLSearchParams): any[] {
  let result = [...rows];
  params.forEach((paramValue, key) => {
    if (["select", "order", "limit"].includes(key)) {
      return;
    }
    if (paramValue.startsWith("eq.")) {
      const target = paramValue.slice(3);
      result = result.filter((row) => normalizeValue(row[key]) === target);
    } else if (paramValue.startsWith("in.(")) {
      const raw = paramValue.slice(4, -1);
      const set = raw
        .split(",")
        .map((v) => v.replace(/["']/g, "").trim())
        .filter(Boolean);
      result = result.filter((row) => set.includes(normalizeValue(row[key])));
    }
  });

  const order = params.get("order");
  if (order) {
    const [column, direction] = order.split(".");
    result.sort((a, b) => {
      const aVal = normalizeValue(a[column]);
      const bVal = normalizeValue(b[column]);
      if (aVal === bVal) return 0;
      return direction === "desc"
        ? aVal > bVal
          ? -1
          : 1
        : aVal > bVal
          ? 1
          : -1;
    });
  }

  const limit = params.get("limit");
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!Number.isNaN(limitNum)) {
      result = result.slice(0, limitNum);
    }
  }

  return result;
}

/**
 * Mock Stripe checkout session creation
 */
export async function mockStripeCheckout(page: Page) {
  await page.route("**/api/checkout/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === "POST" && url.pathname.includes("/checkout")) {
      // Get request body to determine subscription type
      const body = await request.postDataJSON().catch(() => ({}));
      const subscriptionType = body.type || "monthly";

      // Create mock checkout session
      const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const mockSession = {
        id: sessionId,
        url: `https://checkout.stripe.com/test/${sessionId}`,
        object: "checkout.session",
        status: "open",
        mode: subscriptionType === "lifetime" ? "payment" : "subscription",
        payment_status: "unpaid",
        client_reference_id: body.userId || null,
        metadata: {
          subscription_type: subscriptionType,
          user_id: body.userId || null,
        },
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(mockSession),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock Stripe webhook processing
 */
export async function mockStripeWebhook(page: Page) {
  await page.route("**/api/webhooks/stripe**", async (route) => {
    const request = route.request();

    if (request.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ received: true }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock jobs/trips/requests endpoints
 */
async function registerRestHandlers(page: Page, dataStore: Required<TestData>) {
  const handler = async (route: any) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const table = extractTable(url.pathname);

    if (!table || !(table in dataStore)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
      return;
    }

    const rows = dataStore[table];

    if (method === "GET") {
      const filtered = filterRows(rows, url.searchParams);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Content-Type": "application/json",
          "Content-Range": `0-${filtered.length - 1}/${filtered.length}`,
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(filtered),
      });
      return;
    }

    if (method === "POST") {
      const body = (await request.postDataJSON().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const newRecord = {
        id: body.id || `mock_${Date.now()}`,
        ...body,
        created_at: body.created_at || new Date().toISOString(),
        updated_at: body.updated_at || new Date().toISOString(),
      };
      rows.push(newRecord);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(newRecord),
      });
      return;
    }

    await route.continue();
  };

  await page.route("**/rest/v1/**", handler);
  await page.route("**/*supabase*/rest/v1/**", handler);
}

/**
 * Mock RPC functions (e.g., lifetime availability check)
 */
export async function mockRPCFunctions(page: Page) {
  // Mock get_lifetime_availability
  await page.route(
    "**/rest/v1/rpc/get_lifetime_availability**",
    async (route) => {
      const request = route.request();

      if (request.method() === "POST") {
        // Mock response: 500 spots remaining
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ count: 500, limit: 1000 }),
        });
      } else {
        await route.continue();
      }
    }
  );
}

/**
 * Set up all comprehensive mocks at once
 */
export async function setupComprehensiveMocks(
  page: Page,
  options: {
    stripe?: boolean;
    rpc?: boolean;
    testData?: TestData;
  } = {}
) {
  const { stripe = true, rpc = true, testData } = options;

  // Remove any prior fallback handlers so our detailed mocks take precedence
  await page.unroute("**/rest/v1/**").catch(() => {});
  await page.unroute("**/*supabase*/rest/v1/**").catch(() => {});

  const dataStore = cloneDataStore(testData);
  await registerRestHandlers(page, dataStore);

  if (stripe) {
    await mockStripeCheckout(page);
    await mockStripeWebhook(page);
  }

  if (rpc) {
    await mockRPCFunctions(page);
  }
}
