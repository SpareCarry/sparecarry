/**
 * Message Content Filter
 *
 * Prevents users from sharing sensitive information that could lead to
 * transactions outside the platform (similar to Airbnb's messaging system)
 */

export interface ContentFilterResult {
  isValid: boolean;
  blockedPattern?: string;
  userMessage: string;
}

/**
 * Patterns to detect and block:
 * - Phone numbers (various formats)
 * - Email addresses
 * - External payment links (Venmo, PayPal, CashApp, Zelle, etc.)
 * - URLs (except approved domains)
 * - Social media handles (@username)
 * - Other contact information
 */
const BLOCKED_PATTERNS = [
  // Phone numbers - various formats
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // US format: 123-456-7890, 123.456.7890, 123 456 7890
  /\b\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // International: +1 (123) 456-7890
  /\b\d{10,15}\b/g, // Long number sequences (10-15 digits)

  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // External payment services (case insensitive)
  /\b(venmo|paypal|cashapp|cash app|zelle|western union|moneygram|bitcoin|btc|ethereum|eth|crypto)\b/gi,

  // URLs (http, https, www)
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,

  // Social media handles
  /@[A-Za-z0-9_]+/g,

  // Common workarounds
  /\b(contact me|text me|call me|dm me|direct message|private message)\s+(at|@|on)\s+[^\s]+/gi,
  /\b(my|the)\s+(phone|number|email|handle|username|ig|insta|facebook|fb|twitter|snap|telegram|whatsapp)\s+(is|are|:)\s*[^\s]+/gi,
];

// Approved domains that are allowed (e.g., SpareCarry's own domain)
const APPROVED_DOMAINS = [
  "sparecarry.com",
  "stripe.com", // Payment processing
];

/**
 * Check if a URL is from an approved domain
 */
function isApprovedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    return APPROVED_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Validate message content and block sensitive information
 */
export function validateMessageContent(content: string): ContentFilterResult {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return {
      isValid: false,
      userMessage: "Please enter a message.",
    };
  }

  // Check each blocked pattern
  for (const pattern of BLOCKED_PATTERNS) {
    const matches = trimmedContent.match(pattern);
    if (matches && matches.length > 0) {
      // Special handling for URLs - check if they're approved
      if (pattern.source.includes("http") || pattern.source.includes("www")) {
        const allApproved = matches.every((match) => {
          // Remove trailing punctuation
          const cleanMatch = match.replace(/[.,;:!?]+$/, "");
          return isApprovedUrl(cleanMatch);
        });
        if (allApproved) {
          continue; // Skip this pattern if all URLs are approved
        }
      }

      // Determine what was blocked for user-friendly message
      let blockedPattern = "sensitive information";
      if (
        pattern.source.includes("phone") ||
        pattern.source.includes("\\d{10}")
      ) {
        blockedPattern = "phone numbers";
      } else if (
        pattern.source.includes("@") &&
        pattern.source.includes("email")
      ) {
        blockedPattern = "email addresses";
      } else if (pattern.source.includes("venmo|paypal|cashapp")) {
        blockedPattern = "external payment services";
      } else if (
        pattern.source.includes("http") ||
        pattern.source.includes("www")
      ) {
        blockedPattern = "external links";
      } else if (pattern.source.includes("@[A-Za-z]")) {
        blockedPattern = "social media handles";
      }

      return {
        isValid: false,
        blockedPattern,
        userMessage: `For your safety and to keep all transactions on SpareCarry, we can't send messages containing ${blockedPattern}. Please keep all communication on the platform.`,
      };
    }
  }

  return {
    isValid: true,
    userMessage: "",
  };
}

/**
 * Check if content contains blocked patterns (for real-time validation in UI)
 */
export function hasBlockedContent(content: string): boolean {
  const result = validateMessageContent(content);
  return !result.isValid;
}
