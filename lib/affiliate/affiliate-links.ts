// Affiliate link generators with address auto-fill
// Replace with your actual affiliate IDs

const AFFILIATE_IDS = {
  west_marine: process.env.NEXT_PUBLIC_WEST_MARINE_AFFILIATE_ID || "",
  svb: process.env.NEXT_PUBLIC_SVB_AFFILIATE_ID || "",
  amazon: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_ID || "",
};

interface ShippingAddress {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export function generateWestMarineLink(
  searchQuery: string,
  address?: ShippingAddress
): string {
  const baseUrl = "https://www.westmarine.com";
  const searchParams = new URLSearchParams({
    q: searchQuery,
  });

  if (AFFILIATE_IDS.west_marine) {
    searchParams.append("affiliate_id", AFFILIATE_IDS.west_marine);
  }

  // West Marine doesn't support direct address pre-fill in URL
  // But we can store it for later use
  const url = `${baseUrl}/search?${searchParams.toString()}`;
  return url;
}

export function generateSVBLink(
  searchQuery: string,
  address?: ShippingAddress
): string {
  const baseUrl = "https://www.svb24.com";
  const searchParams = new URLSearchParams({
    search: searchQuery,
  });

  if (AFFILIATE_IDS.svb) {
    searchParams.append("ref", AFFILIATE_IDS.svb);
  }

  const url = `${baseUrl}/en/search?${searchParams.toString()}`;
  return url;
}

export function generateAmazonLink(
  searchQuery: string,
  address?: ShippingAddress
): string {
  const baseUrl = "https://www.amazon.com";
  const searchParams = new URLSearchParams({
    k: searchQuery,
  });

  if (AFFILIATE_IDS.amazon) {
    searchParams.append("tag", AFFILIATE_IDS.amazon);
  }

  // Amazon supports address pre-fill via their address book
  // We can use their address helper or provide instructions
  const url = `${baseUrl}/s?${searchParams.toString()}`;
  return url;
}

export function generatePurchaseLink(
  retailer: "west_marine" | "svb" | "amazon",
  searchQuery: string,
  address?: ShippingAddress
): string {
  switch (retailer) {
    case "west_marine":
      return generateWestMarineLink(searchQuery, address);
    case "svb":
      return generateSVBLink(searchQuery, address);
    case "amazon":
      return generateAmazonLink(searchQuery, address);
    default:
      return "";
  }
}

// Generate shipping address string for manual entry
export function formatShippingAddress(address: ShippingAddress): string {
  return `${address.name}\n${address.address_line1}${
    address.address_line2 ? `\n${address.address_line2}` : ""
  }\n${address.city}, ${address.state} ${address.postal_code}\n${address.country}`;
}

