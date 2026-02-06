import Stripe from "stripe";

import { AppError } from "@/server/shared/errors/app-error";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new AppError("Missing STRIPE_SECRET_KEY", 500, "stripe_not_configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export async function createStripeCheckoutSession(input: {
  lineItems: Array<{ name: string; description?: string; unitAmount: number; quantity: number }>;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  const stripe = getStripeClient();

  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: input.lineItems.map((lineItem) => ({
      price_data: {
        currency: "usd",
        unit_amount: lineItem.unitAmount,
        product_data: {
          name: lineItem.name,
          description: lineItem.description
        }
      },
      quantity: lineItem.quantity
    })),
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: input.metadata
  });
}
