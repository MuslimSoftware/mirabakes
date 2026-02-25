import { prisma } from "@/server/shared/db/prisma";
import type { Product } from "@/shared/types/domain";

type ListAdminProductsInput = {
  page: number;
  pageSize: number;
  category?: string;
  q?: string;
  isAvailable?: boolean;
};

type AdminProductUpdateInput = {
  name?: string;
  description?: string;
  priceCents?: number;
  amount?: string | null;
  size?: string | null;
  calories?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  isAvailable?: boolean;
};

type AdminProductCreateInput = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  amount?: string | null;
  size?: string | null;
  calories?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  isAvailable: boolean;
};

export class AdminProductsRepository {
  async findAll(input: ListAdminProductsInput): Promise<{ items: Product[]; total: number }> {
    const skip = (input.page - 1) * input.pageSize;
    const where = {
      ...(input.category ? { category: input.category } : {}),
      ...(typeof input.isAvailable === "boolean" ? { isAvailable: input.isAvailable } : {}),
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
        orderBy: { updatedAt: "desc" }
      }),
      prisma.product.count({ where })
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { slug } });
  }

  async create(input: AdminProductCreateInput): Promise<Product> {
    return prisma.product.create({
      data: input
    });
  }

  async updateById(id: string, update: AdminProductUpdateInput): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: update
    });
  }

  async countOrderItemsByProductId(productId: string): Promise<number> {
    return prisma.orderItem.count({
      where: { productId }
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id }
    });
  }

  async archiveById(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: {
        isAvailable: false
      }
    });
  }
}

export const adminProductsRepository = new AdminProductsRepository();
