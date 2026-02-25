"use client";

import { ordersClient } from "@/frontend/api/clients/orders.client";
import { useApiCached } from "@/frontend/hooks/useApiCached";

export function OrderStatusView({ orderNumber }: { orderNumber: string }) {
  const { data, isLoading, error } = useApiCached({
    queryKey: ["order", orderNumber],
    queryFn: () => ordersClient.getStatus(orderNumber),
    refetchInterval: 5_000,
    refetchIntervalInBackground: true
  });

  if (isLoading) {
    return <p>Loading order status...</p>;
  }

  if (error || !data) {
    return <p>Could not load order. Please contact support with your order number.</p>;
  }

  return (
    <section className="card">
      <h1>Order {data.orderNumber}</h1>
      <p className="muted">Bookmark or save this page to check your order status later.</p>
      <p>
        Status: <strong>{data.status.toUpperCase()}</strong>
      </p>
      <p className="muted">Placed at {new Date(data.createdAt).toLocaleString()}</p>
      <p>
        Total: <strong>${(data.subtotalCents / 100).toFixed(2)}</strong>
      </p>
    </section>
  );
}
