/**
 * Mobile-only screens layout
 * Screens in this directory are only available on mobile (iOS/Android)
 */

import { Stack } from "expo-router";

export default function MobileOnlyLayout() {
  return (
    <Stack>
      <Stack.Screen name="camera" options={{ title: "Camera" }} />
      <Stack.Screen name="location" options={{ title: "Location" }} />
    </Stack>
  );
}
