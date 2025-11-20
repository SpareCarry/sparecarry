/**
 * Browse Load Test Script
 * 
 * Simulates users browsing trips and requests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const browseErrorRate = new Rate('browse_errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://staging.sparecarry.com';
const API_URL = `${BASE_URL}/api`;

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    browse_errors: ['rate<0.01'],
  },
};

export function setup() {
  // Setup: Get authentication token if needed
  // For public browsing, we might not need auth
  return {
    baseUrl: BASE_URL,
    apiUrl: API_URL,
  };
}

export default function (data) {
  const { baseUrl, apiUrl } = data;

  // Scenario: Browse home page
  let res = http.get(baseUrl, {
    tags: { name: 'Browse Home' },
  });
  check(res, {
    'home page status is 200': (r) => r.status === 200,
    'home page loads within 1s': (r) => r.timings.duration < 1000,
  }) || browseErrorRate.add(1);

  sleep(1);

  // Scenario: Browse trips
  res = http.get(`${apiUrl}/trips?limit=20&offset=0`, {
    tags: { name: 'Browse Trips' },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  check(res, {
    'trips API status is 200': (r) => r.status === 200,
    'trips API response time < 500ms': (r) => r.timings.duration < 500,
    'trips API returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
  }) || browseErrorRate.add(1);

  sleep(2);

  // Scenario: Browse requests
  res = http.get(`${apiUrl}/requests?limit=20&offset=0`, {
    tags: { name: 'Browse Requests' },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  check(res, {
    'requests API status is 200': (r) => r.status === 200,
    'requests API response time < 500ms': (r) => r.timings.duration < 500,
    'requests API returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
  }) || browseErrorRate.add(1);

  sleep(1);

  // Scenario: View trip details (if we have a trip ID)
  // This would require fetching a trip ID first
  res = http.get(`${apiUrl}/trips?limit=1`, {
    tags: { name: 'Get Trip ID' },
  });
  
  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      const trips = body.data || body;
      if (trips.length > 0) {
        const tripId = trips[0].id;
        
        res = http.get(`${apiUrl}/trips/${tripId}`, {
          tags: { name: 'View Trip Details' },
        });
        check(res, {
          'trip details status is 200': (r) => r.status === 200,
          'trip details response time < 500ms': (r) => r.timings.duration < 500,
        }) || browseErrorRate.add(1);
      }
    } catch (e) {
      browseErrorRate.add(1);
    }
  }

  sleep(2);
}

export function teardown(data) {
  // Cleanup if needed
}

