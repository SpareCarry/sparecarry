import Stripe from "stripe";

// Lazy initialization to avoid errors during static export build
let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16" as any, // Using older API version for compatibility
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export getStripeInstance for direct access when needed
export { getStripeInstance };

// Export as a getter to prevent initialization during build
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeInstance()[prop as keyof Stripe];
  },
  apply(_target, _thisArg, args) {
    return (getStripeInstance() as any)(...args);
  },
}) as Stripe;

