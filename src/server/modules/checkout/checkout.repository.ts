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
    items: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
  }) {
    return ordersRepository.createPendingOrder(input);
  }
}

export const checkoutRepository = new CheckoutRepository();
