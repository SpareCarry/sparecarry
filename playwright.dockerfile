# Playwright Docker configuration for consistent E2E testing
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build Next.js app
RUN pnpm build

# Set environment variables for testing
ENV NODE_ENV=test
ENV NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_123
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

# Expose port for Next.js
EXPOSE 3000

# Default command runs Playwright tests
CMD ["pnpm", "test:e2e"]

