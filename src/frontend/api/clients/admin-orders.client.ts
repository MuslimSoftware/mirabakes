import { apiRequest } from "@/frontend/api/http/client";
import type { PaginatedResponse } from "@/shared/types/api";
import type { AdminOrder } from "@/shared/types/domain";

export type AdminListOrdersParams = {
  page?: number;
  pageSize?: number;
  status?: string;
};

function adminHeaders(token: string) {
  return {
    "x-admin-token": token
  };
}

export const adminOrdersClient = {
  list(params: AdminListOrdersParams, token: string) {
    return apiRequest<PaginatedResponse<AdminOrder>>("/api/v1/admin/orders", {
      method: "GET",
      query: {
        page: params.page,
        pageSize: params.pageSize,
        status: params.status
      },
      headers: adminHeaders(token)
    });
  },

  getById(id: string, token: string) {
    return apiRequest<AdminOrder>(`/api/v1/admin/orders/${id}`, {
      method: "GET",
      headers: adminHeaders(token)
    });
  },

  cancel(id: string, token: string) {
    return apiRequest<AdminOrder>(`/api/v1/admin/orders/${id}/cancel`, {
      method: "POST",
      headers: adminHeaders(token)
    });
  },

  refund(id: string, body: { amountCents?: number }, token: string) {
    return apiRequest<AdminOrder>(`/api/v1/admin/orders/${id}/refund`, {
      method: "POST",
      body,
      headers: adminHeaders(token)
    });
  }
};
