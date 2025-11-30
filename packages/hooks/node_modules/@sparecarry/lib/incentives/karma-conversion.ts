/**
 * Karma Points Conversion System
 *
 * Converts karma points to credit at checkout
 * Conversion rate: 200 points = $1 credit
 * Usage limit: Max 200 points ($1) per delivery
 * Expiration: 60 days from award
 */

export const KARMA_TO_CREDIT_RATE = 200; // 200 points = $1 credit
export const MAX_KARMA_PER_DELIVERY = 200; // Max points that can be used per delivery ($1 max credit)
export const REFERRAL_KARMA_POINTS = 2000; // Points awarded for referral
export const KARMA_EXPIRATION_DAYS = 60; // Points expire after 60 days

export interface KarmaCredit {
  points: number;
  creditAmount: number; // In dollars
  expiresAt: string; // ISO date string
  source: "referral" | "milestone" | "other";
}

/**
 * Convert karma points to credit amount
 * @param points - Karma points to convert
 * @returns Credit amount in dollars
 */
export function convertKarmaToCredit(points: number): number {
  return points / KARMA_TO_CREDIT_RATE;
}

/**
 * Calculate maximum karma points that can be used for a delivery
 * @param platformFee - Platform fee for the delivery
 * @param availableKarma - Available karma points
 * @returns Maximum points that can be used (capped at MAX_KARMA_PER_DELIVERY)
 */
export function calculateMaxKarmaUsage(
  platformFee: number,
  availableKarma: number
): number {
  // Can use up to $1 credit (200 points) per delivery
  // But not more than available karma
  // And not more than platform fee (can't get negative fee)
  const maxCreditFromKarma = convertKarmaToCredit(MAX_KARMA_PER_DELIVERY);
  const maxCreditFromAvailable = convertKarmaToCredit(availableKarma);
  const maxCreditFromFee = platformFee; // Can't use more than the fee itself

  const maxCredit = Math.min(
    maxCreditFromKarma,
    maxCreditFromAvailable,
    maxCreditFromFee
  );

  // Convert back to points
  return Math.floor(maxCredit * KARMA_TO_CREDIT_RATE);
}

/**
 * Check if karma points are expired
 * @param expiresAt - Expiration date (ISO string)
 * @returns true if expired
 */
export function isKarmaExpired(expiresAt: string): boolean {
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  return now > expirationDate;
}

/**
 * Calculate expiration date for karma points
 * @param daysFromNow - Number of days from now
 * @returns ISO date string
 */
export function calculateKarmaExpiration(
  daysFromNow: number = KARMA_EXPIRATION_DAYS
): string {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + daysFromNow);
  return expirationDate.toISOString();
}

/**
 * Format karma points for display (hide conversion rate)
 * @param points - Karma points
 * @returns Formatted string
 */
export function formatKarmaPoints(points: number): string {
  if (points === 0) return "0";
  if (points < 1000) return points.toLocaleString();
  return `${(points / 1000).toFixed(1)}k`;
}

/**
 * Get explanation text for karma points (without revealing conversion rate)
 */
export function getKarmaPointsExplanation(): string {
  return "Karma points are rewards you earn for helping the SpareCarry community. You can use them to reduce platform fees at checkout. The more points you have, the more you can save!";
}

/**
 * Get usage instructions for karma points
 */
export function getKarmaUsageInstructions(): string {
  return "At checkout, you can choose to use your karma points to reduce the platform fee. Points are automatically applied if you have enough, and you'll see exactly how much you're saving.";
}
