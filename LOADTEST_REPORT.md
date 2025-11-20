# Load Test Report Guide

**Date**: November 20, 2025  
**Status**: ✅ **LOAD TESTING SYSTEM COMPLETE**

---

## Overview

This guide explains how to interpret k6 load test results and understand system performance under load.

---

## 1. Understanding k6 Metrics

### Key Metrics

#### HTTP Request Duration
- **p(95)**: 95th percentile - 95% of requests completed within this time
- **p(99)**: 99th percentile - 99% of requests completed within this time
- **avg**: Average response time
- **min/max**: Minimum and maximum response times

**Example:**
```
http_req_duration: p(95)=450ms, p(99)=850ms, avg=200ms
```
This means:
- 95% of requests completed in < 450ms
- 99% of requests completed in < 850ms
- Average response time was 200ms

#### HTTP Request Failed Rate
- Percentage of requests that failed (non-2xx/3xx status codes)
- **Target**: < 0.5% (0.005)

**Example:**
```
http_req_failed: rate=0.002 (0.2%)
```
This means 0.2% of requests failed.

#### Virtual Users (VUs)
- Number of concurrent simulated users
- Higher VUs = more load

#### Iterations
- Total number of test iterations completed
- Higher iterations = more throughput

---

## 2. Thresholds

### Default Thresholds

```javascript
thresholds: {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.005'],
}
```

### Threshold Interpretation

| Threshold | Meaning | Pass/Fail |
|-----------|---------|-----------|
| `p(95)<500` | 95% of requests < 500ms | ✅ Pass if met |
| `p(99)<1000` | 99% of requests < 1000ms | ✅ Pass if met |
| `rate<0.005` | Error rate < 0.5% | ✅ Pass if met |

### Scenario-Specific Thresholds

**Browse (Read-Only):**
- `p(95)<500ms` - Fast response expected
- `p(99)<1000ms` - Even outliers should be fast

**Write Operations (Post, Match):**
- `p(95)<1000ms` - Slightly slower acceptable
- `p(99)<2000ms` - Complex operations may take longer

**Spike Tests:**
- More lenient thresholds during spikes
- `p(95)<1000ms` - Allow degradation during spikes
- `rate<0.01` - Allow up to 1% error rate

---

## 3. Test Scenarios

### Ramp-Up Scenario

**Purpose**: Test system behavior under gradually increasing load

**Stages:**
1. 0 → 50 VUs over 2 minutes
2. 50 → 100 VUs over 5 minutes
3. 100 → 200 VUs over 10 minutes
4. Hold at 200 VUs for 15 minutes
5. 200 → 100 VUs over 5 minutes
6. 100 → 0 VUs over 2 minutes

**What to Look For:**
- Response times should remain stable as load increases
- Error rate should stay low
- System should handle peak load (200 VUs) without degradation

**Red Flags:**
- Response times increase significantly during ramp-up
- Error rate spikes at higher VUs
- System becomes unresponsive

### Steady-State Scenario

**Purpose**: Test system stability over extended period

**Stages:**
1. 0 → 100 VUs over 2 minutes
2. Hold at 100 VUs for 30 minutes
3. 100 → 0 VUs over 2 minutes

**What to Look For:**
- Consistent performance over time
- No memory leaks (response times should not degrade)
- Stable error rate

**Red Flags:**
- Response times gradually increase over time
- Error rate increases over time
- System becomes slower after extended load

### Spike Scenario

**Purpose**: Test system behavior under sudden load spikes

**Stages:**
1. 50 VUs (normal load)
2. 50 → 500 VUs (10x spike) over 1 minute
3. Hold at 500 VUs for 2 minutes
4. 500 → 50 VUs over 1 minute
5. Hold at 50 VUs for 2 minutes

**What to Look For:**
- System should handle spike gracefully
- Response times may increase but should recover
- Error rate may increase but should stay < 1%

**Red Flags:**
- System crashes during spike
- Response times don't recover after spike
- High error rate (> 5%)

---

## 4. Interpreting Results

### Good Results

```
✓ http_req_duration: p(95)=450ms, p(99)=850ms
✓ http_req_failed: rate=0.001 (0.1%)
✓ http_req_duration{name:Browse Home}: p(95)=300ms
```

**Interpretation:**
- ✅ All thresholds met
- ✅ Fast response times
- ✅ Low error rate
- ✅ System performing well

### Warning Results

```
⚠ http_req_duration: p(95)=550ms (threshold: 500ms)
✓ http_req_failed: rate=0.002 (0.2%)
```

**Interpretation:**
- ⚠️ p95 slightly exceeded threshold
- ✅ Error rate still acceptable
- ⚠️ May need optimization or capacity increase

### Failed Results

```
✗ http_req_duration: p(95)=1200ms (threshold: 500ms)
✗ http_req_failed: rate=0.015 (1.5%)
```

**Interpretation:**
- ❌ Response times too high
- ❌ Error rate too high
- ❌ System not meeting performance requirements
- ❌ Need investigation and optimization

---

## 5. Performance Baselines

### Expected Performance

| Endpoint | p95 Target | p99 Target | Notes |
|----------|------------|------------|-------|
| Browse Home | < 500ms | < 1000ms | Static/SSG page |
| Browse Trips | < 500ms | < 1000ms | API query |
| Post Request | < 1000ms | < 2000ms | Write operation |
| Auto-Match | < 2000ms | < 3000ms | Complex operation |
| Send Message | < 1000ms | < 2000ms | Write + realtime |

### Capacity Targets

| Scenario | Target VUs | Expected Behavior |
|----------|------------|-------------------|
| Normal Load | 50-100 | All thresholds met |
| Peak Load | 200 | Thresholds may be slightly exceeded |
| Spike | 500 | Degradation acceptable, should recover |

---

## 6. Common Issues and Solutions

### High Response Times

**Symptoms:**
- p95 > threshold
- Gradual increase over time

**Possible Causes:**
1. Database query performance
2. External API latency
3. Insufficient server resources
4. Network issues

**Solutions:**
1. Optimize database queries
2. Add caching
3. Scale up servers
4. Check network connectivity

### High Error Rate

**Symptoms:**
- Error rate > 0.5%
- 5xx status codes

**Possible Causes:**
1. Server overload
2. Database connection pool exhaustion
3. Memory leaks
4. Application bugs

**Solutions:**
1. Increase server capacity
2. Optimize connection pooling
3. Fix memory leaks
4. Debug application errors

### System Crashes

**Symptoms:**
- Test fails completely
- No responses
- Connection refused

**Possible Causes:**
1. Server out of memory
2. Database overload
3. Application crash
4. Network issues

**Solutions:**
1. Increase server memory
2. Optimize database
3. Fix application bugs
4. Check infrastructure

---

## 7. Reporting

### Console Output

k6 prints real-time metrics to console:

```
running (5m00.0s), 000/100 VUs, 1250 complete and 0 interrupted iterations
browse     ✓ 1250
  ✓ home page status is 200
  ✓ home page loads within 1s
  ✓ trips API status is 200
  ✓ trips API response time < 500ms

  checks.........................: 100.00% ✓ 5000    ✗ 0
  data_received..................: 12 MB   40 kB/s
  data_sent......................: 2.1 MB  7.0 kB/s
  http_req_duration..............: avg=200ms min=50ms med=180ms max=850ms p(90)=350ms p(95)=450ms
  http_req_failed................: 0.00%   ✓ 0       ✗ 0
  http_reqs......................: 5000    16.6/s
  iteration_duration.............: avg=3.2s min=1.5s med=3.0s max=5.5s
  iterations.....................: 1250    4.16/s
  vus............................: 100     min=100   max=100
```

### HTML Report

Generate HTML report:

```bash
k6 run script.js --out json=results.json
k6-to-html results.json -o report.html
```

**Report Includes:**
- Summary statistics
- Response time distribution
- Error breakdown
- Request timeline
- Threshold status

### JSON Results

JSON output for programmatic analysis:

```bash
k6 run script.js --out json=results.json
```

---

## 8. Best Practices

### 1. Start Small

- Begin with low VUs (10-20)
- Gradually increase
- Monitor system behavior

### 2. Test Regularly

- Run nightly against staging
- Test before major releases
- Test after infrastructure changes

### 3. Compare Results

- Track metrics over time
- Compare before/after optimizations
- Set performance budgets

### 4. Test Realistic Scenarios

- Mix of read/write operations
- Realistic user behavior
- Appropriate think times

### 5. Monitor During Tests

- Watch server metrics
- Monitor database performance
- Check application logs

---

## 9. CI Integration

### Automatic Testing

- **Nightly**: Steady-state test against staging
- **On PR**: Quick smoke test (optional)
- **Before Release**: Full test suite

### Failure Handling

- Tests fail if thresholds exceeded
- Results uploaded as artifacts
- Notifications sent to team

### Manual Testing

- Trigger via GitHub Actions UI
- Select scenario and environment
- Customize duration

---

## 10. Safety Considerations

### Staging Environment

- Always test against staging first
- Use dedicated test database
- Restore from backup if needed

### Test Data

- Use test user accounts
- Clean up test data after runs
- Don't pollute production data

### Payment Testing

- Use test Stripe keys
- Never charge real cards
- Verify test mode enabled

### Resource Limits

- Don't overload staging
- Coordinate with team
- Monitor infrastructure

---

## 11. Summary

✅ **Load Testing System Complete**

- k6 test scripts for all scenarios
- Ramp, steady, and spike scenarios
- CI integration
- Comprehensive reporting
- Safety measures

**Status**: Production-ready load testing system.

---

**Last Updated**: November 20, 2025

