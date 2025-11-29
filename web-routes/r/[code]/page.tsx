import { ReferralLandingPageClient } from "./referral-page-client";

// Required for static export with dynamic routes
export async function generateStaticParams() {
  return [];
}

export default function ReferralLandingPage() {
  return <ReferralLandingPageClient />;
}
