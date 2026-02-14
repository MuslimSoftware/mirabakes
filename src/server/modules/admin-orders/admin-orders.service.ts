import { OrderStatus } from "@prisma/client";

import { createStripeRefund } from "@/server/integrations/stripe/stripe.client";
import { adminOrdersRepository } from "@/server/modules/admin-orders/admin-orders.repository";
import { paymentsRepository } from "@/server/modules/payments/payments.repository";
import { AppError } from "@/server/shared/errors/app-error";
import type { AdminOrder } from "@/shared/types/domain";

type OrderWithRelations = NonNullable<Awaited<ReturnType<typeof adminOrdersRepository.findById>>>;

function mapOrder(order: OrderWithRelations): AdminOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status.toLowerCase() as AdminOrder["status"],
    subtotalCents: order.subtotalCents,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      provider: p.provider,
      externalId: p.externalId,
      status: p.status.toLowerCase(),
      amountCents: p.amountCents,
      createdAt: p.createdAt.toISOString()
    })),
    refundAmountCents: order.refundAmountCents,
    refundedAt: order.refundedAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString()
  };
}

async function refundViaStripe(orderId: string, amountCents?: number) {
  const payment = await paymentsRepository.findSucceededByOrderId(orderId);
  if (!payment) {
    throw new AppError("No succeeded payment found for this order", 400, "no_payment");
  }

  const refund = await createStripeRefund({
    paymentIntentId: payment.externalId,
    amountCents
  });

  await paymentsRepository.createRefunded({
    orderId,
    externalId: refund.id,
    amountCents: refund.amount
  });

  return refund;
}

export class AdminOrdersService {
  async list(input: { page: number; pageSize: number; status?: OrderStatus }) {
    const result = await adminOrdersRepository.findAll(input);

    const items: AdminOrder[] = result.items.map(mapOrder);

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / input.pageSize))
    };
  }

  async getById(id: string) {
    const order = await adminOrdersRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404, "order_not_found");
    }
    return mapOrder(order);
  }

  async cancelOrder(id: string) {
    const order = await adminOrdersRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404, "order_not_found");
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new AppError("Order is already in a terminal state", 400, "already_terminal");
    }

    if (order.status === OrderStatus.PAID) {
      await refundViaStripe(order.id);
    }

    const updated = await adminOrdersRepository.updateStatus(id, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date()
    });

    return mapOrder(updated);
  }

  async refundOrder(id: string, amountCents?: number) {
    const order = await adminOrdersRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404, "order_not_found");
    }

    if (order.status !== OrderStatus.PAID) {
      throw new AppError("Only paid orders can be refunded", 400, "invalid_status");
    }

    if (amountCents !== undefined) {
      if (amountCents < 1 || amountCents > order.subtotalCents) {
        throw new AppError(
          `Refund amount must be between 1 and ${order.subtotalCents} cents`,
          400,
          "invalid_amount"
        );
      }
    }

    await refundViaStripe(order.id, amountCents);

    const isFullRefund = !amountCents || amountCents === order.subtotalCents;

    const updated = await adminOrdersRepository.updateStatus(id, {
      status: isFullRefund ? OrderStatus.REFUNDED : OrderStatus.PAID,
      refundAmountCents: amountCents ?? order.subtotalCents,
      refundedAt: new Date()
    });

    return mapOrder(updated);
  }
}

export const adminOrdersService = new AdminOrdersService();
