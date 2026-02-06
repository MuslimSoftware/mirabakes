import type Stripe from "stripe";

import { getStripeClient } from "@/server/integrations/stripe/stripe.client";
import { AppError } from "@/server/shared/errors/app-error";

export function constructStripeEvent(payload: string, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError("Missing STRIPE_WEBHOOK_SECRET", 500, "stripe_not_configured");
  }

  const stripe = getStripeClient();

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    throw new AppError("Invalid webhook signature", 400, "invalid_webhook_signature");
  }
}
