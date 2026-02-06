export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  category: string | null;
};

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

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
