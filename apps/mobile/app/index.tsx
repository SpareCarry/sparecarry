/**
 * Root index route - redirects to login for testing
 * This handles the initial "/" route
 */

import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to login page for testing
  return <Redirect href="/auth/login" />;
}
