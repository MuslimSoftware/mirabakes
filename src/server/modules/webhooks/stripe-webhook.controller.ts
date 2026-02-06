import { NextResponse } from "next/server";

import { constructStripeEvent } from "@/server/integrations/stripe/stripe.webhook";
import { stripeWebhookService } from "@/server/modules/webhooks/stripe-webhook.service";
import { AppError } from "@/server/shared/errors/app-error";
import { handleRouteError } from "@/server/shared/errors/http-error-handler";

export class StripeWebhookController {
  async handle(request: Request) {
    try {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        throw new AppError("Missing Stripe signature", 400, "missing_stripe_signature");
      }

      const payload = await request.text();
      const event = constructStripeEvent(payload, signature);
      await stripeWebhookService.processEvent(event);

      return NextResponse.json({ data: { received: true } });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const stripeWebhookController = new StripeWebhookController();
