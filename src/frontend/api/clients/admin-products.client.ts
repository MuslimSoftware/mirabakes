import { apiRequest } from "@/frontend/api/http/client";
import type { PaginatedResponse } from "@/shared/types/api";
import type { Product } from "@/shared/types/domain";

export type AdminListProductsParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  isAvailable?: boolean;
};

export type AdminUpdateProductInput = {
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

export type AdminCreateProductInput = {
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

function adminHeaders(token: string) {
  return {
    "x-admin-token": token
  };
}

export const adminProductsClient = {
  list(params: AdminListProductsParams, token: string) {
    return apiRequest<PaginatedResponse<Product>>("/api/v1/admin/products", {
      method: "GET",
      query: {
        page: params.page,
        pageSize: params.pageSize,
        q: params.q,
        category: params.category,
        isAvailable: params.isAvailable
      },
      headers: adminHeaders(token)
    });
  },

  update(id: string, payload: AdminUpdateProductInput, token: string) {
    return apiRequest<Product>(`/api/v1/admin/products/${id}`, {
      method: "PATCH",
      body: payload,
      headers: adminHeaders(token)
    });
  },

  create(payload: AdminCreateProductInput, token: string) {
    return apiRequest<Product>("/api/v1/admin/products", {
      method: "POST",
      body: payload,
      headers: adminHeaders(token)
    });
  },

  remove(id: string, token: string) {
    return apiRequest<{ deleted: boolean }>(`/api/v1/admin/products/${id}`, {
      method: "DELETE",
      headers: adminHeaders(token)
    });
  }
};
