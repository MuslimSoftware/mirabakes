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

const imagesInclude = {
  images: {
    select: { id: true, position: true },
    orderBy: { position: "asc" as const }
  }
};

type ProductWithImages = Product & {
  images: { id: string; position: number }[];
};

export class AdminProductsRepository {
  async findAll(input: ListAdminProductsInput): Promise<{ items: ProductWithImages[]; total: number }> {
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
        orderBy: { updatedAt: "desc" },
        include: imagesInclude
      }),
      prisma.product.count({ where })
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<ProductWithImages | null> {
    return prisma.product.findUnique({
      where: { id },
      include: imagesInclude
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { slug } });
  }

  async create(input: AdminProductCreateInput): Promise<ProductWithImages> {
    return prisma.product.create({
      data: input,
      include: imagesInclude
    });
  }

  async updateById(id: string, update: AdminProductUpdateInput): Promise<ProductWithImages> {
    return prisma.product.update({
      where: { id },
      data: update,
      include: imagesInclude
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

  async deleteImage(imageId: string): Promise<void> {
    await prisma.productImage.delete({
      where: { id: imageId }
    });
  }
}

export const adminProductsRepository = new AdminProductsRepository();
