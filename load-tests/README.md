# Load Testing with k6

This directory contains load testing scripts for SpareCarry using [k6](https://k6.io/).

## Quick Start

### Prerequisites

1. **Install k6:**

   ```bash
   # macOS
   brew install k6

   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D9B
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6

   # Windows
   choco install k6
   ```

2. **Set environment variables:**
   ```bash
   export BASE_URL=https://staging.sparecarry.com
   export TEST_USER_EMAIL=test@example.com
   export TEST_USER_PASSWORD=testpassword
   ```

### Run Tests

**Browse scenario:**

```bash
cd load-tests
k6 run scripts/browse.js
```

**Ramp-up scenario:**

```bash
k6 run scenarios/ramp.js
```

**Steady-state scenario:**

```bash
k6 run scenarios/steady.js
```

**Spike scenario:**

```bash
k6 run scenarios/spike.js
```

## Test Scripts

### Individual Scripts

- `scripts/browse.js` - Browse trips and requests
- `scripts/post_request.js` - Post delivery requests
- `scripts/match_flow.js` - Complete matchmaking flow
- `scripts/chat_flow.js` - Chat interactions

### Scenarios

- `scenarios/ramp.js` - Gradual ramp-up (50 → 200 VUs)
- `scenarios/steady.js` - Steady-state (100 VUs for 30 minutes)
- `scenarios/spike.js` - Spike test (50 → 500 VUs)

## Configuration

Edit `k6-config.json` to customize:

- Default VUs and duration
- Thresholds
- Environment settings

## CI Integration

Load tests run automatically:

- **Nightly**: Steady-state test against staging
- **Manual**: Any scenario against staging or production

See `.github/workflows/loadtest.yml` for details.

## Safety

⚠️ **Important**:

- Tests use **staging environment** by default
- Payment flows use **test Stripe keys**
- Tests use **dedicated test database**
- Never run against production without approval

## Reports

k6 generates:

- **Console output**: Real-time metrics
- **JSON results**: `results.json`
- **HTML report**: `report.html` (via k6-to-html)

## Thresholds

Tests fail if:

- p95 response time > 500ms (browse) or 1000ms (write operations)
- Error rate > 0.5%
- p99 response time > 1000ms (browse) or 2000ms (write operations)

See `LOADTEST_REPORT.md` for interpreting results.
