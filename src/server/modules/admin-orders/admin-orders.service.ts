import { type OrderStatus } from "@prisma/client";

import { adminOrdersRepository } from "@/server/modules/admin-orders/admin-orders.repository";
import type { AdminOrder } from "@/shared/types/domain";

export class AdminOrdersService {
  async list(input: { page: number; pageSize: number; status?: OrderStatus }) {
    const result = await adminOrdersRepository.findAll(input);

    const items: AdminOrder[] = result.items.map((order) => ({
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
      createdAt: order.createdAt.toISOString()
    }));

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / input.pageSize))
    };
  }
}

export const adminOrdersService = new AdminOrdersService();
