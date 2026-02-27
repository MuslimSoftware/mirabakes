import { AppError } from "@/server/shared/errors/app-error";
import { productsRepository } from "@/server/modules/products/products.repository";
import type { Product } from "@/shared/types/domain";

type ProductWithImages = Product & {
  images: { id: string; position: number }[];
};

function mapImageUrls(product: ProductWithImages): Product & { imageUrls: string[] } {
  const imageUrls = product.images.length > 0
    ? product.images.map((img) => `/api/v1/images/${img.id}`)
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  return { ...product, imageUrls };
}

export class ProductsService {
  async listAvailable(input: { page: number; pageSize: number; category?: string; q?: string }) {
    const result = await productsRepository.findAvailable(input);

    return {
      items: result.items.map(mapImageUrls),
      page: input.page,
      pageSize: input.pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / input.pageSize))
    };
  }

  async getPublicBySlug(slug: string) {
    const product = await productsRepository.findBySlug(slug);
    if (!product || !product.isAvailable) {
      throw new AppError("Product not found", 404, "product_not_found");
    }

    return mapImageUrls(product);
  }
}

export const productsService = new ProductsService();
