"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { adminOrdersClient } from "@/frontend/api/clients/admin-orders.client";
import { ApiClientError } from "@/frontend/api/http/client";
import { useApiPaginatedCached } from "@/frontend/hooks/useApiPaginatedCached";
import type { AdminOrder, OrderStatus } from "@/shared/types/domain";

const STATUS_OPTIONS = ["all", "pending", "paid", "failed", "cancelled", "refunded"] as const;

const BADGE_CLASS: Record<string, string> = {
  paid: "badge-paid",
  pending: "badge-pending",
  failed: "badge-failed",
  cancelled: "badge-cancelled",
  refunded: "badge-refunded",
  succeeded: "badge-succeeded"
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${BADGE_CLASS[status] ?? ""}`}>{status}</span>;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
  children
}: {
  title: string;
  message: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        {children}
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={loading}>
            Close
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailPanel({
  orderId,
  token,
  onClose,
  onMutated
}: {
  orderId: string;
  token: string;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundAmountStr, setRefundAmountStr] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin-order-detail", orderId],
    queryFn: () => adminOrdersClient.getById(orderId, token)
  });

  const cancelMutation = useMutation({
    mutationFn: () => adminOrdersClient.cancel(orderId, token),
    onSuccess: () => {
      setShowCancelConfirm(false);
      detailQuery.refetch();
      onMutated();
    }
  });

  const refundMutation = useMutation({
    mutationFn: (amountCents?: number) => adminOrdersClient.refund(orderId, { amountCents }, token),
    onSuccess: () => {
      setShowRefundConfirm(false);
      detailQuery.refetch();
      onMutated();
    }
  });

  const order = detailQuery.data;

  function handleRefundConfirm() {
    const parsed = refundAmountStr ? Math.round(Number(refundAmountStr) * 100) : undefined;
    refundMutation.mutate(parsed);
  }

  function openRefundDialog() {
    if (order) {
      setRefundAmountStr((order.subtotalCents / 100).toFixed(2));
    }
    setShowRefundConfirm(true);
  }

  const canCancel = order && ["pending", "paid", "failed"].includes(order.status);
  const canRefund = order?.status === "paid";

  return (
    <>
      <div className="order-detail-overlay" onClick={onClose} />
      <div className="order-detail-panel">
        {detailQuery.isLoading ? <p>Loading...</p> : null}
        {detailQuery.isError ? (
          <p className="admin-error">
            {(detailQuery.error as ApiClientError)?.message ?? "Failed to load order"}
          </p>
        ) : null}

        {order ? (
          <>
            <div className="panel-header">
              <div>
                <h2 style={{ margin: 0 }}>{order.orderNumber}</h2>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {canRefund ? (
                  <button type="button" className="secondary" onClick={openRefundDialog}>
                    Refund
                  </button>
                ) : null}
                {canCancel ? (
                  <button type="button" className="secondary danger" onClick={() => setShowCancelConfirm(true)}>
                    Cancel Order
                  </button>
                ) : null}
                <button
                  type="button"
                  className="secondary"
                  onClick={onClose}
                  style={{ padding: "0.3rem 0.6rem", fontSize: "1.1rem", lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="panel-section">
              <h4>Items</h4>
              {order.items.map((item) => (
                <div key={item.productId} className="row" style={{ padding: "0.25rem 0", fontSize: "0.9rem" }}>
                  <span>{item.productName} &times; {item.quantity}</span>
                  <span>{formatCents(item.unitPriceCents * item.quantity)}</span>
                </div>
              ))}
              <div className="row" style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--border)", marginTop: "0.5rem" }}>
                <strong>Subtotal</strong>
                <strong>{formatCents(order.subtotalCents)}</strong>
              </div>
            </div>

            <div className="panel-section">
              <h4>Customer</h4>
              {order.customerPhone ? <div style={{ fontSize: "0.9rem" }}>Phone: {order.customerPhone}</div> : null}
              {order.customerEmail ? <div style={{ fontSize: "0.9rem" }}>Email: {order.customerEmail}</div> : null}
              {!order.customerPhone && !order.customerEmail ? <div className="muted" style={{ fontSize: "0.9rem" }}>No contact info</div> : null}
            </div>

            <div className="panel-section">
              <h4>Payments</h4>
              {order.payments.length === 0 ? <div className="muted" style={{ fontSize: "0.9rem" }}>No payments</div> : null}
              {order.payments.map((p) => (
                <div key={p.id} className="row" style={{ padding: "0.25rem 0", fontSize: "0.9rem" }}>
                  <div>
                    <StatusBadge status={p.status} />
                    <span className="muted" style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>{p.provider}</span>
                  </div>
                  <span>{formatCents(p.amountCents)}</span>
                </div>
              ))}
            </div>

            {(order.refundAmountCents || order.refundedAt) ? (
              <div className="panel-section">
                <h4>Refund Info</h4>
                {order.refundAmountCents ? (
                  <div style={{ fontSize: "0.9rem" }}>Amount: {formatCents(order.refundAmountCents)}</div>
                ) : null}
                {order.refundedAt ? (
                  <div style={{ fontSize: "0.9rem" }}>Refunded: {formatDate(order.refundedAt)}</div>
                ) : null}
              </div>
            ) : null}

            {order.cancelledAt ? (
              <div className="panel-section">
                <h4>Cancellation</h4>
                <div style={{ fontSize: "0.9rem" }}>Cancelled: {formatDate(order.cancelledAt)}</div>
              </div>
            ) : null}

            <div className="panel-section">
              <h4>Details</h4>
              <div style={{ fontSize: "0.9rem" }}>Created: {formatDate(order.createdAt)}</div>
              <div style={{ fontSize: "0.85rem" }} className="muted">ID: {order.id}</div>
            </div>
          </>
        ) : null}
      </div>

      {showCancelConfirm ? (
        <ConfirmDialog
          title="Cancel Order"
          message={
            order?.status === "paid"
              ? "This order has been paid. Cancelling will issue a full refund via Stripe."
              : "Are you sure you want to cancel this order?"
          }
          confirmLabel="Cancel Order"
          loading={cancelMutation.isPending}
          onConfirm={() => cancelMutation.mutate()}
          onCancel={() => setShowCancelConfirm(false)}
        >
          {cancelMutation.isError ? (
            <p className="admin-error" style={{ marginBottom: "0.5rem" }}>
              {(cancelMutation.error as ApiClientError)?.message ?? "Failed to cancel"}
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}

      {showRefundConfirm ? (
        <ConfirmDialog
          title="Refund Order"
          message="Enter the refund amount. Leave as full amount for a complete refund."
          confirmLabel="Refund"
          loading={refundMutation.isPending}
          onConfirm={handleRefundConfirm}
          onCancel={() => setShowRefundConfirm(false)}
        >
          <label className="admin-field" style={{ marginBottom: "1rem" }}>
            <span>Amount ($)</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={order ? (order.subtotalCents / 100).toFixed(2) : undefined}
              value={refundAmountStr}
              onChange={(e) => setRefundAmountStr(e.target.value)}
            />
          </label>
          {refundMutation.isError ? (
            <p className="admin-error" style={{ marginBottom: "0.5rem" }}>
              {(refundMutation.error as ApiClientError)?.message ?? "Failed to refund"}
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

export function AdminOrdersPanel({ token }: { token: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const ordersQuery = useApiPaginatedCached<AdminOrder, { status?: string }>({
    queryKey: ["admin-orders", token],
    queryFn: (input) =>
      adminOrdersClient.list(
        { page: input.page, pageSize: input.pageSize, status: input.status },
        token
      ),
    params: {
      status: statusFilter === "all" ? undefined : statusFilter
    },
    page,
    pageSize: 20,
    enabled: token.length > 0
  });

  function handleMutated() {
    queryClient.invalidateQueries({ queryKey: ["admin-orders", token] });
  }

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

      {ordersQuery.data && ordersQuery.data.items.length > 0 ? (
        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th className="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.data.items.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  style={selectedOrderId === order.id ? { background: "rgba(199,109,58,0.06)" } : undefined}
                >
                  <td><strong>{order.orderNumber}</strong></td>
                  <td className="muted" style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {order.customerPhone || order.customerEmail || <span className="muted">—</span>}
                  </td>
                  <td>{order.items.length}</td>
                  <td className="text-right">{formatCents(order.subtotalCents)}</td>
                  <td><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

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

      {selectedOrderId ? (
        <OrderDetailPanel
          orderId={selectedOrderId}
          token={token}
          onClose={() => setSelectedOrderId(null)}
          onMutated={handleMutated}
        />
      ) : null}
    </div>
  );
}
