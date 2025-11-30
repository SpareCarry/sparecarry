/**
 * Post Request Load Test Script
 *
 * Simulates users posting delivery requests
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
import {
  randomString,
  randomIntBetween,
} from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

// Custom metrics
const postRequestErrorRate = new Rate("post_request_errors");

// Configuration
const BASE_URL = __ENV.BASE_URL || "https://staging.sparecarry.com";
const API_URL = `${BASE_URL}/api`;

export const options = {
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.02"],
    post_request_errors: ["rate<0.02"],
  },
};

export function setup() {
  // Setup: Authenticate and get user token
  const loginRes = http.post(
    `${API_URL}/auth/login`,
    JSON.stringify({
      email: __ENV.TEST_USER_EMAIL || "test@example.com",
      password: __ENV.TEST_USER_PASSWORD || "testpassword",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  let authToken = null;
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      authToken = body.token || body.access_token;
    } catch (e) {
      console.warn("Failed to parse login response");
    }
  }

  // If auth fails, we might need to use a different approach
  // For now, we'll continue without auth if needed

  return {
    baseUrl: BASE_URL,
    apiUrl: API_URL,
    authToken: authToken,
  };
}

export default function (data) {
  const { apiUrl, authToken } = data;

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Generate random request data
  const locations = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
  ];
  const fromLocation = locations[randomIntBetween(0, locations.length - 1)];
  let toLocation = locations[randomIntBetween(0, locations.length - 1)];
  while (toLocation === fromLocation) {
    toLocation = locations[randomIntBetween(0, locations.length - 1)];
  }

  const requestData = {
    from_location: fromLocation,
    to_location: toLocation,
    weight_kg: randomIntBetween(1, 50),
    preferred_method: ["plane", "boat", "any"][randomIntBetween(0, 2)],
    deadline_earliest: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    deadline_latest: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    max_reward: randomIntBetween(100, 1000),
    description: `Test request ${randomString(10)}`,
  };

  // Post request
  const res = http.post(`${apiUrl}/requests`, JSON.stringify(requestData), {
    headers: headers,
    tags: { name: "Post Request" },
  });

  const success = check(res, {
    "post request status is 200 or 201": (r) =>
      r.status === 200 || r.status === 201,
    "post request response time < 1s": (r) => r.timings.duration < 1000,
    "post request returns request ID": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id || body.data?.id;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    postRequestErrorRate.add(1);
  }

  sleep(3);

  // Optionally: View the created request
  if (res.status === 200 || res.status === 201) {
    try {
      const body = JSON.parse(res.body);
      const requestId = body.id || body.data?.id;

      if (requestId) {
        const viewRes = http.get(`${apiUrl}/requests/${requestId}`, {
          headers: headers,
          tags: { name: "View Posted Request" },
        });

        check(viewRes, {
          "view request status is 200": (r) => r.status === 200,
        }) || postRequestErrorRate.add(1);
      }
    } catch (e) {
      postRequestErrorRate.add(1);
    }
  }

  sleep(2);
}

export function teardown(data) {
  // Cleanup: Optionally delete test requests
}
