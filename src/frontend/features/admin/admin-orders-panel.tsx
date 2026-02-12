"use client";

import { useState } from "react";

import { adminOrdersClient } from "@/frontend/api/clients/admin-orders.client";
import { ApiClientError } from "@/frontend/api/http/client";
import { useApiPaginatedCached } from "@/frontend/hooks/useApiPaginatedCached";
import type { AdminOrder } from "@/shared/types/domain";

const STATUS_OPTIONS = ["all", "pending", "paid", "failed", "cancelled"] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function OrderCard({ order }: { order: AdminOrder }) {
  return (
    <article className="card" style={{ marginBottom: "0.75rem" }}>
      <div className="row" style={{ marginBottom: "0.5rem" }}>
        <h4 style={{ margin: 0 }}>{order.orderNumber}</h4>
        <span
          style={{
            fontSize: "0.8rem",
            padding: "0.15rem 0.5rem",
            borderRadius: "4px",
            background: order.status === "paid" ? "var(--color-success, #22c55e)" : "var(--border)",
            color: order.status === "paid" ? "#fff" : "inherit"
          }}
        >
          {order.status}
        </span>
      </div>

      <div className="row" style={{ marginBottom: "0.25rem" }}>
        <span className="muted" style={{ fontSize: "0.85rem" }}>
          {formatDate(order.createdAt)}
        </span>
        <strong>${(order.subtotalCents / 100).toFixed(2)}</strong>
      </div>

      {(order.customerPhone || order.customerEmail) ? (
        <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          {order.customerPhone ? <div>Phone: {order.customerPhone}</div> : null}
          {order.customerEmail ? <div>Email: {order.customerEmail}</div> : null}
        </div>
      ) : null}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {order.items.map((item) => (
          <li key={item.productId} className="row" style={{ padding: "0.15rem 0", fontSize: "0.9rem" }}>
            <span>
              {item.productName} &times; {item.quantity}
            </span>
            <span className="muted">${((item.unitPriceCents * item.quantity) / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function AdminOrdersPanel({ token }: { token: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const ordersQuery = useApiPaginatedCached<AdminOrder, { status?: string }>({
    queryKey: ["admin-orders", token],
    queryFn: (input) =>
      adminOrdersClient.list(
        {
          page: input.page,
          pageSize: input.pageSize,
          status: input.status
        },
        token
      ),
    params: {
      status: statusFilter === "all" ? undefined : statusFilter
    },
    page,
    pageSize: 20,
    enabled: token.length > 0
  });

  const isUnauthorized =
    ordersQuery.error instanceof ApiClientError && ordersQuery.error.status === 401;

  return (
    <div>
      <section className="card" style={{ marginBottom: "1rem" }}>
        <div className="admin-filters">
          <label className="admin-field">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {ordersQuery.isLoading ? <p>Loading orders...</p> : null}
      {isUnauthorized ? <p className="admin-error">Invalid admin token.</p> : null}
      {ordersQuery.isError && !isUnauthorized ? (
        <p className="admin-error">Could not load orders.</p>
      ) : null}

      {ordersQuery.data?.items.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}

      {ordersQuery.data && ordersQuery.data.items.length === 0 && !ordersQuery.isLoading ? (
        <p className="muted">No orders found.</p>
      ) : null}

      {ordersQuery.data && ordersQuery.data.totalPages > 1 ? (
        <section className="row row-responsive" style={{ marginTop: "1rem" }}>
          <button
            className="secondary"
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <p>
            Page {ordersQuery.data.page} / {ordersQuery.data.totalPages}
          </p>
          <button
            className="secondary"
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={ordersQuery.data.page >= ordersQuery.data.totalPages}
          >
            Next
          </button>
        </section>
      ) : null}
    </div>
  );
}
