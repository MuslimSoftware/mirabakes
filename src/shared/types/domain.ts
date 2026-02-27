export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  amount: string | null;
  size: string | null;
  calories: number | null;
  imageUrl: string | null;
  imageUrls?: string[];
  isAvailable: boolean;
  category: string | null;
};

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export type OrderItem = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
};

export type PublicOrder = {
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  createdAt: string;
};

export type AdminOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
};

export type AdminPayment = {
  id: string;
  provider: string;
  externalId: string;
  status: string;
  amountCents: number;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  customerEmail: string | null;
  customerPhone: string | null;
  items: AdminOrderItem[];
  payments: AdminPayment[];
  refundAmountCents: number | null;
  refundedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};
