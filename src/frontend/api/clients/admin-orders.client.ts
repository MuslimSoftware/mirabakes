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
  }
};
