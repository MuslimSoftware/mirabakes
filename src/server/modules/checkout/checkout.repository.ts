import { ordersRepository } from "@/server/modules/orders/orders.repository";
import { productsRepository } from "@/server/modules/products/products.repository";

export class CheckoutRepository {
  findAvailableProductsByIds(ids: string[]) {
    return productsRepository.findByIds(ids);
  }

  createPendingOrder(input: {
    orderNumber: string;
    subtotalCents: number;
    customerEmail?: string;
    customerPhone?: string;
    items: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
  }) {
    return ordersRepository.createPendingOrder(input);
  }

  attachStripeSessionId(orderNumber: string, stripeSessionId: string) {
    return ordersRepository.setStripeSessionIdByOrderNumber(orderNumber, stripeSessionId);
  }
}

export const checkoutRepository = new CheckoutRepository();
