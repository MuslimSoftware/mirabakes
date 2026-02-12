import { apiRequest } from "@/frontend/api/http/client";

export type CheckoutLineItemInput = {
  productId: string;
  quantity: number;
};

export type CreateCheckoutSessionInput = {
  items: CheckoutLineItemInput[];
  customerEmail?: string;
  customerPhone: string;
};

export type CreateCheckoutSessionResult = {
  checkoutUrl: string;
  sessionId: string;
  orderNumber: string;
};

export const checkoutClient = {
  createSession(payload: CreateCheckoutSessionInput) {
    return apiRequest<CreateCheckoutSessionResult>("/api/v1/checkout/session", {
      method: "POST",
      body: payload
    });
  }
};
