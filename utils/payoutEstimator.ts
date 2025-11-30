/**
 * Payout ETA Estimator
 *
 * Estimates when travelers will receive their payout after delivery confirmation
 * Based on Stripe Connect settlement times and payment method
 */

export interface PayoutEstimate {
  estimatedHours: number;
  estimatedDays: number;
  estimatedDate: Date;
  method: "instant" | "standard" | "manual";
  message: string;
}

/**
 * Estimate payout ETA based on delivery confirmation time
 */
export function estimatePayoutETA(
  confirmedAt: Date,
  paymentMethod?: "stripe_connect" | "bank_transfer" | "other"
): PayoutEstimate {
  const now = new Date();
  const hoursSinceConfirmation =
    (now.getTime() - confirmedAt.getTime()) / (1000 * 60 * 60);

  // Default to Stripe Connect if not specified
  const method = paymentMethod || "stripe_connect";

  let estimatedHours: number;
  let methodType: "instant" | "standard" | "manual";
  let message: string;

  switch (method) {
    case "stripe_connect":
      // Stripe Connect: 2-7 business days (typically 2-3 days)
      // Assuming instant payouts not enabled
      estimatedHours = 48; // 2 days default
      methodType = "standard";
      message =
        "Payout typically arrives within 2-3 business days via Stripe Connect";
      break;

    case "bank_transfer":
      // Bank transfer: 3-5 business days
      estimatedHours = 72; // 3 days default
      methodType = "standard";
      message = "Bank transfer typically takes 3-5 business days";
      break;

    case "other":
    default:
      // Manual or other: 5-7 business days
      estimatedHours = 120; // 5 days default
      methodType = "manual";
      message = "Payout processing may take 5-7 business days";
      break;
  }

  // Calculate estimated date
  const estimatedDate = new Date(confirmedAt);
  estimatedDate.setHours(estimatedDate.getHours() + estimatedHours);

  // Adjust for weekends (add extra days if falls on weekend)
  const dayOfWeek = estimatedDate.getDay();
  if (dayOfWeek === 0) {
    // Sunday
    estimatedDate.setDate(estimatedDate.getDate() + 1);
    estimatedHours += 24;
  } else if (dayOfWeek === 6) {
    // Saturday
    estimatedDate.setDate(estimatedDate.getDate() + 2);
    estimatedHours += 48;
  }

  const estimatedDays = Math.ceil(estimatedHours / 24);

  return {
    estimatedHours: Math.round(estimatedHours),
    estimatedDays,
    estimatedDate,
    method: methodType,
    message,
  };
}

/**
 * Format payout ETA for display
 */
export function formatPayoutETA(estimate: PayoutEstimate): string {
  const now = new Date();
  const hoursUntil =
    (estimate.estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil <= 0) {
    return "Payout should arrive soon";
  }

  if (hoursUntil < 24) {
    return `Payout expected in ${Math.round(hoursUntil)} hours`;
  }

  const daysUntil = Math.ceil(hoursUntil / 24);
  if (daysUntil === 1) {
    return "Payout expected tomorrow";
  }

  return `Payout expected in ${daysUntil} days (${estimate.estimatedDate.toLocaleDateString()})`;
}

/**
 * Get payout status color for UI
 */
export function getPayoutStatusColor(estimate: PayoutEstimate): string {
  const now = new Date();
  const hoursUntil =
    (estimate.estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil <= 0) {
    return "text-green-600"; // Arrived
  }

  if (hoursUntil < 24) {
    return "text-blue-600"; // Soon
  }

  if (hoursUntil < 72) {
    return "text-yellow-600"; // Pending
  }

  return "text-slate-600"; // Later
}
