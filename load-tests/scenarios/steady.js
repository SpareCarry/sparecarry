/**
 * Steady-State Load Test Scenario
 * 
 * Maintains constant load to test system stability over time
 */

import browse from '../scripts/browse.js';
import postRequest from '../scripts/post_request.js';
import matchFlow from '../scripts/match_flow.js';
import chatFlow from '../scripts/chat_flow.js';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 VUs over 2 minutes
    { duration: '30m', target: 100 },  // Hold at 100 VUs for 30 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 VUs over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.005'], // Less than 0.5% error rate
    'http_req_duration{name:Browse Home}': ['p(95)<500'],
    'http_req_duration{name:Browse Trips}': ['p(95)<500'],
    'http_req_duration{name:Post Request}': ['p(95)<1000'],
    'http_req_duration{name:Trigger Auto-Match}': ['p(95)<2000'],
  },
};

// Distribute VUs across different scenarios
export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% browsing
    browse();
  } else if (scenario < 0.6) {
    // 20% posting requests
    postRequest();
  } else if (scenario < 0.85) {
    // 25% match flow
    matchFlow();
  } else {
    // 15% chat flow
    chatFlow();
  }
}

