/**
 * Constants for PostRequestForm
 */

export const PLANE_MAX_WEIGHT_KG = 32;
export const PLANE_MAX_LINEAR_CM = 158; // length + width + height

export const DEADLINE_URGENCY_OPTIONS = [
  { value: "3" as const, label: "3 days", days: 3 },
  { value: "7" as const, label: "7 days", days: 7 },
  { value: "14" as const, label: "14 days", days: 14 },
  { value: "14+" as const, label: "14+ days", days: 30 },
] as const;

