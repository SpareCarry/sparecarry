/**
 * Spike Load Test Scenario
 *
 * Tests system behavior under sudden load spikes
 */

import browse from "../scripts/browse.js";
import postRequest from "../scripts/post_request.js";
import matchFlow from "../scripts/match_flow.js";
import chatFlow from "../scripts/chat_flow.js";

export const options = {
  stages: [
    { duration: "1m", target: 50 }, // Normal load: 50 VUs
    { duration: "1m", target: 500 }, // Spike: 500 VUs (10x increase)
    { duration: "2m", target: 500 }, // Hold spike for 2 minutes
    { duration: "1m", target: 50 }, // Return to normal: 50 VUs
    { duration: "2m", target: 50 }, // Hold normal for 2 minutes
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"], // More lenient during spikes
    http_req_failed: ["rate<0.01"], // Allow up to 1% error rate during spikes
    "http_req_duration{name:Browse Home}": ["p(95)<1000"],
    "http_req_duration{name:Browse Trips}": ["p(95)<1000"],
  },
};

// Distribute VUs across different scenarios
export default function () {
  const scenario = Math.random();

  if (scenario < 0.5) {
    // 50% browsing (lightweight)
    browse();
  } else if (scenario < 0.7) {
    // 20% posting requests
    postRequest();
  } else if (scenario < 0.9) {
    // 20% match flow
    matchFlow();
  } else {
    // 10% chat flow
    chatFlow();
  }
}
