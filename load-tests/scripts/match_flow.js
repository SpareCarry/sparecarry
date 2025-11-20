/**
 * Match Flow Load Test Script
 * 
 * Simulates the matchmaking flow: trip/request creation → auto-match → view matches
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const matchFlowErrorRate = new Rate('match_flow_errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://staging.sparecarry.com';
const API_URL = `${BASE_URL}/api`;

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.02'],
    match_flow_errors: ['rate<0.02'],
  },
};

export function setup() {
  // Setup: Authenticate
  const loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER_EMAIL || 'test@example.com',
    password: __ENV.TEST_USER_PASSWORD || 'testpassword',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  let authToken = null;
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      authToken = body.token || body.access_token;
    } catch (e) {
      console.warn('Failed to parse login response');
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
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Step 1: Create a trip or request
  const locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
  ];
  const fromLocation = locations[randomIntBetween(0, locations.length - 1)];
  let toLocation = locations[randomIntBetween(0, locations.length - 1)];
  while (toLocation === fromLocation) {
    toLocation = locations[randomIntBetween(0, locations.length - 1)];
  }

  // Randomly create trip or request
  const createTrip = Math.random() > 0.5;
  let entityId = null;
  let entityType = null;

  if (createTrip) {
    // Create trip
    const tripData = {
      from_location: fromLocation,
      to_location: toLocation,
      type: ['plane', 'boat'][randomIntBetween(0, 1)],
      spare_kg: randomIntBetween(10, 100),
      eta_window_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      eta_window_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const tripRes = http.post(`${apiUrl}/trips`, JSON.stringify(tripData), {
      headers: headers,
      tags: { name: 'Create Trip' },
    });

    const tripSuccess = check(tripRes, {
      'create trip status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'create trip response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (tripSuccess && (tripRes.status === 200 || tripRes.status === 201)) {
      try {
        const body = JSON.parse(tripRes.body);
        entityId = body.id || body.data?.id;
        entityType = 'trip';
      } catch (e) {
        matchFlowErrorRate.add(1);
      }
    } else {
      matchFlowErrorRate.add(1);
    }
  } else {
    // Create request
    const requestData = {
      from_location: fromLocation,
      to_location: toLocation,
      weight_kg: randomIntBetween(1, 50),
      preferred_method: ['plane', 'boat', 'any'][randomIntBetween(0, 2)],
      deadline_earliest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      deadline_latest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      max_reward: randomIntBetween(100, 1000),
    };

    const requestRes = http.post(`${apiUrl}/requests`, JSON.stringify(requestData), {
      headers: headers,
      tags: { name: 'Create Request' },
    });

    const requestSuccess = check(requestRes, {
      'create request status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'create request response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (requestSuccess && (requestRes.status === 200 || requestRes.status === 201)) {
      try {
        const body = JSON.parse(requestRes.body);
        entityId = body.id || body.data?.id;
        entityType = 'request';
      } catch (e) {
        matchFlowErrorRate.add(1);
      }
    } else {
      matchFlowErrorRate.add(1);
    }
  }

  sleep(2);

  // Step 2: Trigger auto-match (if entity was created)
  if (entityId && entityType) {
    const matchRes = http.post(`${apiUrl}/matches/auto-match`, JSON.stringify({
      type: entityType,
      id: entityId,
    }), {
      headers: headers,
      tags: { name: 'Trigger Auto-Match' },
    });

    check(matchRes, {
      'auto-match status is 200': (r) => r.status === 200,
      'auto-match response time < 2s': (r) => r.timings.duration < 2000,
    }) || matchFlowErrorRate.add(1);

    sleep(3);

    // Step 3: View matches
    const matchesRes = http.get(`${apiUrl}/matches?${entityType}_id=${entityId}`, {
      headers: headers,
      tags: { name: 'View Matches' },
    });

    check(matchesRes, {
      'view matches status is 200': (r) => r.status === 200,
      'view matches response time < 1s': (r) => r.timings.duration < 1000,
      'matches API returns data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data || body);
        } catch {
          return false;
        }
      },
    }) || matchFlowErrorRate.add(1);
  }

  sleep(2);
}

export function teardown(data) {
  // Cleanup if needed
}

