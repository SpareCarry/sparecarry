# 🧪 Playwright Test Quick Start Guide

## ✅ Correct Commands

### Run All Tests

```bash
npx playwright test
```

### Run Tests with UI (Recommended for First Time)

```bash
npx playwright test --ui
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/auth-flow.spec.ts
```

### Run Tests with Detailed Output

```bash
npx playwright test --reporter=list
```

### View Test Report (HTML)

```bash
npx playwright show-report
```

---

## ⚠️ Important: Start Server First!

**Before running tests, you MUST start the production server:**

1. **Build the application** (if not already built):

   ```bash
   pnpm build
   ```

2. **Start the server** (in a separate terminal):

   ```bash
   pnpm start
   ```

   Wait until you see: `✓ Ready on http://localhost:3000`

3. **Then run tests** (in another terminal):
   ```bash
   npx playwright test
   ```

---

## 📝 Common Commands

| Command                        | Description              |
| ------------------------------ | ------------------------ |
| `npx playwright test`          | Run all tests            |
| `npx playwright test --ui`     | Run with interactive UI  |
| `npx playwright test --headed` | Run with visible browser |
| `npx playwright test --debug`  | Run in debug mode        |
| `npx playwright show-report`   | View HTML test report    |
| `npx playwright install`       | Install browser binaries |

---

## 🎯 Quick Test Run

**Full sequence:**

```bash
# Terminal 1: Start server
pnpm build
pnpm start

# Terminal 2: Run tests (wait for server to be ready)
npx playwright test
```

---

**Note**: Make sure Playwright is installed: `pnpm install` should have installed it. If not, run `pnpm install @playwright/test`.
