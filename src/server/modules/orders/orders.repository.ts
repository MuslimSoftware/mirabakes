import { OrderStatus } from "@prisma/client";

import { prisma } from "@/server/shared/db/prisma";
import type { OrderStatus as PublicOrderStatus } from "@/shared/types/domain";

function toPublicStatus(status: OrderStatus): PublicOrderStatus {
  return status.toLowerCase() as PublicOrderStatus;
}

export class OrdersRepository {
  async createPendingOrder(input: {
    orderNumber: string;
    subtotalCents: number;
    customerEmail?: string;
    customerPhone?: string;
    items: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
  }) {
    return prisma.order.create({
      data: {
        orderNumber: input.orderNumber,
        subtotalCents: input.subtotalCents,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        status: OrderStatus.PENDING,
        items: {
          createMany: {
            data: input.items
          }
        }
      }
    });
  }

  async findPublicByOrderNumber(orderNumber: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        subtotalCents: true,
        createdAt: true
      }
    });

    if (!order) {
      return null;
    }

    return {
      orderNumber: order.orderNumber,
      status: toPublicStatus(order.status),
      subtotalCents: order.subtotalCents,
      createdAt: order.createdAt.toISOString()
    };
  }

  async markPaidByOrderNumber(orderNumber: string, stripeSessionId: string) {
    return prisma.order.update({
      where: { orderNumber },
      data: {
        status: OrderStatus.PAID,
        stripeSessionId
      },
      select: {
        id: true,
        subtotalCents: true
      }
    });
  }

  async markFailedByOrderNumber(orderNumber: string) {
    return prisma.order.update({
      where: { orderNumber },
      data: {
        status: OrderStatus.FAILED
      },
      select: {
        id: true,
        subtotalCents: true
      }
    });
  }
}

export const ordersRepository = new OrdersRepository();
