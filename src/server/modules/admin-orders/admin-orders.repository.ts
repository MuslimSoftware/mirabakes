import { type OrderStatus } from "@prisma/client";

import { prisma } from "@/server/shared/db/prisma";

type ListAdminOrdersInput = {
  page: number;
  pageSize: number;
  status?: OrderStatus;
};

const orderInclude = {
  items: {
    include: {
      product: { select: { name: true } }
    }
  },
  payments: true
} as const;

export class AdminOrdersRepository {
  async findAll(input: ListAdminOrdersInput) {
    const skip = (input.page - 1) * input.pageSize;
    const where = input.status ? { status: input.status } : {};

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: input.pageSize,
        orderBy: { createdAt: "desc" },
        include: orderInclude
      }),
      prisma.order.count({ where })
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: orderInclude
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: OrderStatus;
      refundAmountCents?: number;
      refundedAt?: Date;
      cancelledAt?: Date;
    }
  ) {
    return prisma.order.update({
      where: { id },
      data,
      include: orderInclude
    });
  }
}

export const adminOrdersRepository = new AdminOrdersRepository();
