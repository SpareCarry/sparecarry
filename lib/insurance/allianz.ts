// Allianz Travel Insurance API placeholder
// Replace with actual Allianz API integration

interface InsuranceQuote {
  coverage_amount: number;
  item_value: number;
  route_from: string;
  route_to: string;
  premium: number;
  policy_number?: string;
}

interface InsurancePolicy {
  policy_number: string;
  coverage_amount: number;
  premium: number;
  status: "active" | "pending" | "expired" | "claimed";
  effective_date: string;
  expiry_date: string;
}

export async function getInsuranceQuote(
  itemValue: number,
  routeFrom: string,
  routeTo: string,
  coverageAmount: number = 2000000 // $2M default
): Promise<InsuranceQuote> {
  // Placeholder: Calculate premium as 5% of item value, minimum $50
  const basePremium = Math.max(itemValue * 0.05, 50);
  
  // Add route risk factor (placeholder logic)
  const routeRisk = calculateRouteRisk(routeFrom, routeTo);
  const premium = basePremium * routeRisk;

  return {
    coverage_amount: coverageAmount,
    item_value: itemValue,
    route_from: routeFrom,
    route_to: routeTo,
    premium: Math.round(premium * 100) / 100, // Round to 2 decimals
  };
}

function calculateRouteRisk(from: string, to: string): number {
  // Placeholder: Simple risk calculation
  // In production, use Allianz API or risk database
  const highRiskRoutes = [
    "miami",
    "panama",
    "colombia",
    "venezuela",
    "haiti",
  ];
  
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();
  
  if (
    highRiskRoutes.some((r) => fromLower.includes(r)) ||
    highRiskRoutes.some((r) => toLower.includes(r))
  ) {
    return 1.2; // 20% premium increase
  }
  
  return 1.0; // Standard risk
}

export async function purchaseInsurance(
  quote: InsuranceQuote,
  matchId: string,
  userId: string
): Promise<InsurancePolicy> {
  // Placeholder: In production, call Allianz API to purchase policy
  const policyNumber = `ALL-${Date.now()}-${matchId.slice(0, 8).toUpperCase()}`;
  
  return {
    policy_number: policyNumber,
    coverage_amount: quote.coverage_amount,
    premium: quote.premium,
    status: "active",
    effective_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
  };
}

export async function checkInsuranceStatus(
  policyNumber: string
): Promise<InsurancePolicy | null> {
  // Placeholder: In production, call Allianz API to check status
  return null;
}

export async function fileInsuranceClaim(
  policyNumber: string,
  claimDetails: {
    description: string;
    damage_amount: number;
    photos: string[];
  }
): Promise<{ claim_number: string; status: string }> {
  // Placeholder: In production, call Allianz API to file claim
  return {
    claim_number: `CLM-${Date.now()}`,
    status: "submitted",
  };
}

