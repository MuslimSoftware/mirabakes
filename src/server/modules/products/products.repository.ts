import { prisma } from "@/server/shared/db/prisma";
import type { Product } from "@/shared/types/domain";

type ListAvailableInput = {
  page: number;
  pageSize: number;
  category?: string;
  q?: string;
};

type ProductWithImages = Product & {
  images: { id: string; position: number }[];
};

const imagesInclude = {
  images: {
    select: { id: true, position: true },
    orderBy: { position: "asc" as const }
  }
};

export class ProductsRepository {
  async findAvailable(input: ListAvailableInput): Promise<{ items: ProductWithImages[]; total: number }> {
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
        orderBy: { createdAt: "desc" },
        include: imagesInclude
      }),
      prisma.product.count({ where })
    ]);

    return { items, total };
  }

  async findBySlug(slug: string): Promise<ProductWithImages | null> {
    return prisma.product.findUnique({
      where: { slug },
      include: imagesInclude
    });
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
