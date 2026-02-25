import Stripe from "stripe";

import { AppError } from "@/server/shared/errors/app-error";

let stripeClient: Stripe | null = null;
const DEFAULT_STRIPE_API_VERSION = "2026-01-28.clover";

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const apiVersion = process.env.STRIPE_API_VERSION ?? DEFAULT_STRIPE_API_VERSION;

  if (!secretKey) {
    throw new AppError("Missing STRIPE_SECRET_KEY", 500, "stripe_not_configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: apiVersion as Stripe.StripeConfig["apiVersion"]
    });
  }

  return stripeClient;
}

export async function createStripeRefund(input: {
  paymentIntentId: string;
  amountCents?: number;
}) {
  const stripe = getStripeClient();

  return stripe.refunds.create({
    payment_intent: input.paymentIntentId,
    ...(input.amountCents ? { amount: input.amountCents } : {})
  });
}

export async function createStripeCheckoutSession(input: {
  lineItems: Array<{ name: string; description?: string; unitAmount: number; quantity: number }>;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  const stripe = getStripeClient();
  const orderNumber = input.metadata.orderNumber;

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
    ...(orderNumber ? { client_reference_id: orderNumber } : {}),
    payment_intent_data: {
      metadata: input.metadata
    },
    metadata: input.metadata
  });
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
}
