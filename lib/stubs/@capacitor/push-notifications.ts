/**
 * Stub for @capacitor/push-notifications
 * Used during web builds where Capacitor doesn't exist
 */
export const PushNotifications = {
  requestPermissions: async () => ({ receive: "denied" }),
  register: async () => {},
  addListener: () => ({ remove: () => {} }),
};
