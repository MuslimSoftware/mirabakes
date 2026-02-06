import { apiRequest } from "@/frontend/api/http/client";
import type { PaginatedResponse } from "@/shared/types/api";
import type { Product } from "@/shared/types/domain";

export type ListProductsParams = {
  page?: number;
  pageSize?: number;
  category?: string;
  q?: string;
};

export const productsClient = {
  list(params: ListProductsParams = {}) {
    return apiRequest<PaginatedResponse<Product>>("/api/v1/products", {
      method: "GET",
      query: {
        page: params.page,
        pageSize: params.pageSize,
        category: params.category,
        q: params.q
      }
    });
  },

  getBySlug(slug: string) {
    return apiRequest<Product>(`/api/v1/products/${slug}`);
  }
};
