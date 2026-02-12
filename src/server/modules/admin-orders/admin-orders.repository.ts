import { type OrderStatus } from "@prisma/client";

import { prisma } from "@/server/shared/db/prisma";

type ListAdminOrdersInput = {
  page: number;
  pageSize: number;
  status?: OrderStatus;
};

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
        include: {
          items: {
            include: {
              product: { select: { name: true } }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    return { items, total };
  }
}

export const adminOrdersRepository = new AdminOrdersRepository();
