/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/App/App/Build/Products/Debug-iphonesimulator/App.app',
      build: 'xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -derivedDataPath ios/App/App/Build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/App/App/Build/Products/Release-iphonesimulator/App.app',
      build: 'xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -sdk iphonesimulator -derivedDataPath ios/App/App/Build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
  behavior: {
    init: {
      exposeGlobals: false,
      reinstallApp: true,
    },
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false,
    },
  },
  session: {
    server: {
      url: 'ws://localhost:8099',
      timeout: 60000,
    },
    autoStart: true,
  },
};

