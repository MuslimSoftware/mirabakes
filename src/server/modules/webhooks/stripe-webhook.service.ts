import type Stripe from "stripe";

import { stripeWebhookRepository } from "@/server/modules/webhooks/stripe-webhook.repository";

export class StripeWebhookService {
  async processEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.orderNumber;
        if (!orderNumber) {
          return;
        }

        const updatedOrder = await stripeWebhookRepository.markOrderPaid(orderNumber, session.id);
        await stripeWebhookRepository.recordSucceededPayment({
          orderId: updatedOrder.id,
          externalId: String(session.payment_intent ?? session.id),
          amountCents: updatedOrder.subtotalCents
        });
        return;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.orderNumber;
        if (!orderNumber) {
          return;
        }

        const updatedOrder = await stripeWebhookRepository.markOrderFailed(orderNumber);
        await stripeWebhookRepository.recordFailedPayment({
          orderId: updatedOrder.id,
          externalId: String(session.payment_intent ?? session.id),
          amountCents: updatedOrder.subtotalCents
        });
        return;
      }

      default:
        return;
    }
  }
}

export const stripeWebhookService = new StripeWebhookService();
