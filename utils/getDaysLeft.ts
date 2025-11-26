/**
 * Get Days Left Utility
 * 
 * Calculates days remaining until promo end date
 * Shared helper for all countdown logic
 */

export const getDaysLeft = (): number => {
  const end = new Date("2026-02-18T00:00:00Z");
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
};

