/**
 * Root index route - redirects to tabs
 * This handles the initial "/" route
 */

import { Redirect } from "expo-router";

export default function Index() {
  // Use Redirect component for immediate, reliable redirect
  return <Redirect href="/(tabs)" />;
}
