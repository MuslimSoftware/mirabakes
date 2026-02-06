import { prisma } from "@/server/shared/db/prisma";
import type { Product } from "@/shared/types/domain";

type ListAvailableInput = {
  page: number;
  pageSize: number;
  category?: string;
  q?: string;
};

export class ProductsRepository {
  async findAvailable(input: ListAvailableInput): Promise<{ items: Product[]; total: number }> {
    const skip = (input.page - 1) * input.pageSize;
    const where = {
      isAvailable: true,
      ...(input.category ? { category: input.category } : {}),
      ...(input.q
        ? {
            OR: [
              { name: { contains: input.q, mode: "insensitive" as const } },
              { description: { contains: input.q, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: input.pageSize,
        orderBy: { createdAt: "desc" }
      }),
      prisma.product.count({ where })
    ]);

    return { items, total };
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { slug } });
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        id: { in: ids },
        isAvailable: true
      }
    });
  }
}

export const productsRepository = new ProductsRepository();
