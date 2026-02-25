import { AppError } from "@/server/shared/errors/app-error";

import { adminProductsRepository } from "@/server/modules/admin-products/admin-products.repository";

type AdminProductCreateInput = {
  name: string;
  description: string;
  priceCents: number;
  amount?: string | null;
  size?: string | null;
  calories?: number | null;
  category?: string | null;
  imageUrl?: string | null;
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

function slugifyName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export class AdminProductsService {
  async list(input: {
    page: number;
    pageSize: number;
    category?: string;
    q?: string;
    isAvailable?: boolean;
  }) {
    const result = await adminProductsRepository.findAll(input);

    return {
      items: result.items,
      page: input.page,
      pageSize: input.pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / input.pageSize))
    };
  }

  async updateById(id: string, input: AdminProductUpdateInput) {
    const product = await adminProductsRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404, "product_not_found");
    }

    return adminProductsRepository.updateById(id, input);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugifyName(name) || `product-${Date.now().toString(36)}`;
    let candidate = baseSlug;
    let suffix = 2;

    while (await adminProductsRepository.findBySlug(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  async create(input: AdminProductCreateInput) {
    const slug = await this.generateUniqueSlug(input.name);

    return adminProductsRepository.create({
      slug,
      name: input.name,
      description: input.description,
      priceCents: input.priceCents,
      amount: input.amount ?? null,
      size: input.size ?? null,
      calories: input.calories ?? null,
      category: input.category ?? null,
      imageUrl: input.imageUrl ?? null,
      isAvailable: input.isAvailable ?? true
    });
  }

  async deleteById(id: string) {
    const product = await adminProductsRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404, "product_not_found");
    }

    const usedInOrders = await adminProductsRepository.countOrderItemsByProductId(id);
    if (usedInOrders > 0) {
      throw new AppError(
        "Cannot delete product that already appears in orders",
        409,
        "product_in_use"
      );
    }

    await adminProductsRepository.deleteById(id);
  }
}

export const adminProductsService = new AdminProductsService();
