import { apiRequest } from "@/frontend/api/http/client";
import type { PublicOrder } from "@/shared/types/domain";

export const ordersClient = {
  getStatus(orderNumber: string) {
    return apiRequest<PublicOrder>(`/api/v1/orders/${orderNumber}`);
  }
};
