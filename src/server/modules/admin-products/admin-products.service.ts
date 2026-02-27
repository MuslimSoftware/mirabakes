import { AppError } from "@/server/shared/errors/app-error";

import { adminProductsRepository } from "@/server/modules/admin-products/admin-products.repository";
import type { Product } from "@/shared/types/domain";

type ProductWithImages = Product & {
  images: { id: string; position: number }[];
};

function mapImageUrls(product: ProductWithImages) {
  const imageUrls = product.images.length > 0
    ? product.images.map((img) => `/api/v1/images/${img.id}`)
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  return { ...product, imageUrls };
}

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
      items: result.items.map(mapImageUrls),
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

    const updated = await adminProductsRepository.updateById(id, input);
    return mapImageUrls(updated);
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

    const created = await adminProductsRepository.create({
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

    return mapImageUrls(created);
  }

  async deleteById(id: string) {
    const product = await adminProductsRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404, "product_not_found");
    }

    const usedInOrders = await adminProductsRepository.countOrderItemsByProductId(id);
    if (usedInOrders > 0) {
      await adminProductsRepository.archiveById(id);
      return;
    }

    await adminProductsRepository.deleteById(id);
  }

  async deleteImage(productId: string, imageId: string) {
    const product = await adminProductsRepository.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404, "product_not_found");
    }

    const imageExists = product.images.some((img) => img.id === imageId);
    if (!imageExists) {
      throw new AppError("Image not found on this product", 404, "image_not_found");
    }

    await adminProductsRepository.deleteImage(imageId);
  }
}

export const adminProductsService = new AdminProductsService();
