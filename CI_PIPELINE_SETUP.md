# CI/CD Pipeline Setup Guide

This document explains how to integrate the Next.js → Static Export → Capacitor build pipeline into various CI/CD environments.

---

## 📋 Overview

The build pipeline consists of:

1. **Dependency Installation** (`npm install --legacy-peer-deps`)
2. **Linting** (`npm run lint`)
3. **Next.js Build** (`npm run build`)
4. **Export Validation** (`npm run validate:export`)
5. **Capacitor Sync** (`npx cap sync`)

All steps are automated via `scripts/ci-build.sh` or can be run individually.

---

## 🚀 GitHub Actions

### Basic Workflow

Create `.github/workflows/build.yml`:

```yaml
name: Build and Validate

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Run linter
        run: npm run lint
        continue-on-error: true

      - name: Build Next.js
        run: npm run build

      - name: Validate export
        run: npm run validate:export

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: static-export
          path: out/
          retention-days: 7
```

### Using CI Script

```yaml
name: Build and Validate

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Run CI build pipeline
        run: bash scripts/ci-build.sh

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: static-export
          path: out/
          retention-days: 7
```

### Mobile Build Workflow

For iOS/Android builds:

```yaml
name: Mobile Build

on:
  push:
    tags:
      - "v*"

jobs:
  build-mobile:
    runs-on: macos-latest # Required for iOS builds

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Run CI build pipeline
        run: bash scripts/ci-build.sh

      - name: Setup Java (for Android)
        uses: actions/setup-java@v3
        with:
          distribution: "temurin"
          java-version: "17"

      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleRelease

      - name: Build iOS (requires signing)
        run: |
          cd ios
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath build/App.xcarchive \
            archive
```

---

## 🔧 Render CI

Render supports build commands directly in the dashboard:

### Build Command

```bash
npm install --legacy-peer-deps && npm run build && npm run validate:export
```

### Publish Directory

```
out
```

### Environment Variables

- `NODE_VERSION`: `18`
- `NPM_FLAGS`: `--legacy-peer-deps`

---

## ⚡ Vercel CI

Vercel automatically detects Next.js projects. For static export:

### Build Command (override in Vercel dashboard)

```bash
npm run build && npm run validate:export
```

### Output Directory

```
out
```

### Environment Variables

- `NEXT_PUBLIC_*`: Public environment variables
- `NODE_ENV`: `production`

---

## 🐳 Docker

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build and validate
RUN npm run build && npm run validate:export

# Production stage
FROM nginx:alpine

# Copy static files
COPY --from=builder /app/out /usr/share/nginx/html

# Copy nginx config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Build Command

```bash
docker build -t sparecarry-web .
docker run -p 80:80 sparecarry-web
```

---

## 📱 Mobile CI/CD

### iOS (GitHub Actions)

```yaml
name: iOS Build

on:
  push:
    tags:
      - "ios-*"

jobs:
  ios-build:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Build and sync
        run: npm run mobile:build

      - name: Build iOS
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath build/App.xcarchive \
            archive

      - name: Export IPA
        run: |
          xcodebuild -exportArchive \
            -archivePath ios/App/build/App.xcarchive \
            -exportPath ios/App/build/export \
            -exportOptionsPlist ios/App/ExportOptions.plist

      - name: Upload IPA
        uses: actions/upload-artifact@v3
        with:
          name: ios-app
          path: ios/App/build/export/*.ipa
```

### Android (GitHub Actions)

```yaml
name: Android Build

on:
  push:
    tags:
      - "android-*"

jobs:
  android-build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: "temurin"
          java-version: "17"

      - name: Build and sync
        run: npm run mobile:build

      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleRelease

      - name: Sign APK (if keystore configured)
        run: |
          cd android/app/build/outputs/apk/release
          jarsigner -verbose -sigalg SHA256withRSA \
            -digestalg SHA-256 \
            -keystore ${{ secrets.ANDROID_KEYSTORE }} \
            app-release-unsigned.apk \
            ${{ secrets.ANDROID_KEY_ALIAS }}

      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: android-app
          path: android/app/build/outputs/apk/release/*.apk
```

---

## 🔍 Validation in CI

The `validate:export` script ensures:

- ✅ `out/` directory exists
- ✅ `index.html` exists
- ✅ No unresolved `@/` imports
- ✅ No missing asset references

If validation fails, the CI pipeline will fail with a clear error message.

---

## 📊 Build Artifacts

After a successful build:

- **Static files**: `out/` directory
- **Build logs**: Console output
- **Validation report**: `validate:export` output

---

## 🛠️ Troubleshooting

### Build Fails in CI

1. **Check Node.js version**: Ensure Node.js 18+ is used
2. **Check dependencies**: Run `npm install --legacy-peer-deps`
3. **Check validation**: Run `npm run validate:export` locally
4. **Check logs**: Review CI logs for specific errors

### Export Validation Fails

1. **Check `out/` exists**: Ensure build completed
2. **Check `@/` imports**: Run `grep -r "@/" out/` to find unresolved imports
3. **Check assets**: Verify all referenced assets exist

### Mobile Sync Fails

1. **Check Capacitor**: Ensure `npx cap sync` runs after build
2. **Check platforms**: Verify `ios/` and `android/` directories exist
3. **Check plugins**: Ensure all Capacitor plugins are installed

---

## 📝 Best Practices

1. **Always validate**: Run `npm run validate:export` before deploying
2. **Cache dependencies**: Use CI caching for `node_modules`
3. **Parallel builds**: Run linting and building in parallel when possible
4. **Artifact retention**: Keep build artifacts for at least 7 days
5. **Environment variables**: Use secrets for sensitive data

---

## 🔗 Related Documentation

- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Last Updated**: 2025-11-19  
**Pipeline Version**: 1.0.0
