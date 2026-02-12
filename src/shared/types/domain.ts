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

export type AdminOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  customerEmail: string | null;
  customerPhone: string | null;
  items: AdminOrderItem[];
  createdAt: string;
};
