/**
 * Stub for @capacitor/app
 * Used during web builds where Capacitor doesn't exist
 */
export const App = {
  addListener: () => ({ remove: () => {} }),
  getState: async () => ({ isActive: true }),
};
