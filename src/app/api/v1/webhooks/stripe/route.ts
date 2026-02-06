import { stripeWebhookController } from "@/server/modules/webhooks/stripe-webhook.controller";

export async function POST(request: Request) {
  return stripeWebhookController.handle(request);
}
