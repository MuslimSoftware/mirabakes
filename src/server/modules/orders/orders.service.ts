import { OrderStatus } from "@prisma/client";

import { retrieveStripeCheckoutSession } from "@/server/integrations/stripe/stripe.client";
import { getPendingOrderExpiryCutoff } from "@/server/modules/orders/order-expiry";
import { paymentsRepository } from "@/server/modules/payments/payments.repository";
import { ordersRepository } from "@/server/modules/orders/orders.repository";
import { AppError } from "@/server/shared/errors/app-error";
import type { PublicOrder } from "@/shared/types/domain";

type OrderStatusRecord = NonNullable<Awaited<ReturnType<typeof ordersRepository.findStatusByOrderNumber>>>;

function toPublicOrder(order: OrderStatusRecord): PublicOrder {
  return {
    orderNumber: order.orderNumber,
    status: order.status.toLowerCase() as PublicOrder["status"],
    subtotalCents: order.subtotalCents,
    createdAt: order.createdAt.toISOString()
  };
}

async function reconcilePendingOrderStatus(order: OrderStatusRecord): Promise<OrderStatusRecord> {
  if (order.status !== OrderStatus.PENDING) {
    return order;
  }

  if (order.stripeSessionId) {
    try {
      const session = await retrieveStripeCheckoutSession(order.stripeSessionId);

      if (session.payment_status === "paid") {
        const updatedOrder = await ordersRepository.markPaidByOrderNumber(order.orderNumber, session.id);
        await paymentsRepository.createSucceeded({
          orderId: updatedOrder.id,
          externalId: String(session.payment_intent ?? session.id),
          amountCents: updatedOrder.subtotalCents
        });

        return {
          ...order,
          status: OrderStatus.PAID,
          stripeSessionId: session.id
        };
      }

      if (session.status === "expired") {
        const updatedOrder = await ordersRepository.markFailedByOrderNumber(order.orderNumber);
        await paymentsRepository.createFailed({
          orderId: updatedOrder.id,
          externalId: String(session.payment_intent ?? session.id),
          amountCents: updatedOrder.subtotalCents
        });

        return {
          ...order,
          status: OrderStatus.FAILED
        };
      }
    } catch {
      return order;
    }
  }

  const wasExpired = await ordersRepository.expirePendingByOrderNumberIfOlderThan(
    order.orderNumber,
    getPendingOrderExpiryCutoff()
  );
  if (wasExpired) {
    return {
      ...order,
      status: OrderStatus.FAILED
    };
  }

  return order;
}

export class OrdersService {
  async getPublicStatus(orderNumber: string) {
    const order = await ordersRepository.findStatusByOrderNumber(orderNumber);

    if (!order) {
      throw new AppError("Order not found", 404, "order_not_found");
    }

    const reconciledOrder = await reconcilePendingOrderStatus(order);
    return toPublicOrder(reconciledOrder);
  }
}

export const ordersService = new OrdersService();
