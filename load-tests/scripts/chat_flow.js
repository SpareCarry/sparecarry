/**
 * Chat Flow Load Test Script
 *
 * Simulates chat interactions: view matches, send messages
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

// Custom metrics
const chatFlowErrorRate = new Rate("chat_flow_errors");

// Configuration
const BASE_URL = __ENV.BASE_URL || "https://staging.sparecarry.com";
const API_URL = `${BASE_URL}/api`;

export const options = {
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.02"],
    chat_flow_errors: ["rate<0.02"],
  },
};

export function setup() {
  // Setup: Authenticate
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

  // Step 1: Get user's matches
  const matchesRes = http.get(`${apiUrl}/matches`, {
    headers: headers,
    tags: { name: "Get Matches" },
  });

  let matchId = null;
  if (matchesRes.status === 200) {
    try {
      const body = JSON.parse(matchesRes.body);
      const matches = body.data || body;
      if (Array.isArray(matches) && matches.length > 0) {
        matchId = matches[0].id;
      }
    } catch (e) {
      chatFlowErrorRate.add(1);
    }
  }

  check(matchesRes, {
    "get matches status is 200": (r) => r.status === 200,
    "get matches response time < 1s": (r) => r.timings.duration < 1000,
  }) || chatFlowErrorRate.add(1);

  sleep(1);

  // Step 2: View chat messages for a match
  if (matchId) {
    const messagesRes = http.get(`${apiUrl}/matches/${matchId}/messages`, {
      headers: headers,
      tags: { name: "Get Messages" },
    });

    check(messagesRes, {
      "get messages status is 200": (r) => r.status === 200,
      "get messages response time < 1s": (r) => r.timings.duration < 1000,
    }) || chatFlowErrorRate.add(1);

    sleep(1);

    // Step 3: Send a message
    const messageData = {
      match_id: matchId,
      content: `Test message ${randomString(20)}`,
    };

    const sendRes = http.post(
      `${apiUrl}/matches/${matchId}/messages`,
      JSON.stringify(messageData),
      {
        headers: headers,
        tags: { name: "Send Message" },
      }
    );

    check(sendRes, {
      "send message status is 200 or 201": (r) =>
        r.status === 200 || r.status === 201,
      "send message response time < 1s": (r) => r.timings.duration < 1000,
    }) || chatFlowErrorRate.add(1);

    sleep(2);
  } else {
    // If no matches, we might need to create one first
    // For now, we'll just log this scenario
    chatFlowErrorRate.add(0.5); // Partial error for missing match
  }
}

export function teardown(data) {
  // Cleanup if needed
}
