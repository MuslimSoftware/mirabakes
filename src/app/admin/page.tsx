"use client";

import { useEffect, useState } from "react";

import { AdminOrdersPanel } from "@/frontend/features/admin/admin-orders-panel";
import { AdminProductsPanel } from "@/frontend/features/admin/admin-products-panel";

type Tab = "products" | "orders";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("products");

  useEffect(() => {
    const stored = window.localStorage.getItem("admin_api_token");
    if (stored) {
      setToken(stored);
      setTokenDraft(stored);
    }
  }, []);

  function applyToken() {
    const next = tokenDraft.trim();
    setToken(next);
    if (next) {
      window.localStorage.setItem("admin_api_token", next);
    } else {
      window.localStorage.removeItem("admin_api_token");
    }
  }

  return (
    <main>
      <h1>Admin</h1>

      {!token ? (
        <section className="card" style={{ marginBottom: "1rem" }}>
          <div className="admin-token">
            <label className="admin-field admin-field-wide">
              <span>Admin token</span>
              <input
                type="password"
                value={tokenDraft}
                onChange={(e) => setTokenDraft(e.target.value)}
                placeholder="Paste ADMIN_API_TOKEN"
              />
            </label>
            <button className="primary" type="button" onClick={applyToken}>
              Unlock
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="row" style={{ gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              type="button"
              className={activeTab === "products" ? "primary" : "secondary"}
              onClick={() => setActiveTab("products")}
            >
              Products
            </button>
            <button
              type="button"
              className={activeTab === "orders" ? "primary" : "secondary"}
              onClick={() => setActiveTab("orders")}
            >
              Orders
            </button>
          </div>

          {activeTab === "products" ? <AdminProductsPanel token={token} /> : null}
          {activeTab === "orders" ? <AdminOrdersPanel token={token} /> : null}
        </>
      )}
    </main>
  );
}
