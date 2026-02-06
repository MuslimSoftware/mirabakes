import { ordersRepository } from "@/server/modules/orders/orders.repository";
import { paymentsRepository } from "@/server/modules/payments/payments.repository";

export class StripeWebhookRepository {
  markOrderPaid(orderNumber: string, stripeSessionId: string) {
    return ordersRepository.markPaidByOrderNumber(orderNumber, stripeSessionId);
  }

  markOrderFailed(orderNumber: string) {
    return ordersRepository.markFailedByOrderNumber(orderNumber);
  }

  recordSucceededPayment(input: { orderId: string; externalId: string; amountCents: number }) {
    return paymentsRepository.createSucceeded(input);
  }

  recordFailedPayment(input: { orderId: string; externalId: string; amountCents: number }) {
    return paymentsRepository.createFailed(input);
  }
}

export const stripeWebhookRepository = new StripeWebhookRepository();
