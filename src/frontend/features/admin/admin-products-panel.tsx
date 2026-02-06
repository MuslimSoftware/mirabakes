"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  type AdminCreateProductInput,
  type AdminUpdateProductInput,
  adminProductsClient
} from "@/frontend/api/clients/admin-products.client";
import { ApiClientError } from "@/frontend/api/http/client";
import { useApiPaginatedCached } from "@/frontend/hooks/useApiPaginatedCached";
import type { Product } from "@/shared/types/domain";

type ProductEditorProps = {
  product: Product;
  token: string;
  onChanged: () => void;
};

type CreateProductFormProps = {
  token: string;
  onCreated: () => void;
};

type ProductDraft = {
  name: string;
  description: string;
  priceCents: string;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
};

const emptyCreateDraft: ProductDraft = {
  name: "",
  description: "",
  priceCents: "",
  category: "",
  imageUrl: "",
  isAvailable: true
};

function parsePriceCents(value: string): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new Error("Price must be a positive integer in cents");
  }

  return numeric;
}

function normalizeProductPayload(draft: ProductDraft): AdminCreateProductInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    priceCents: parsePriceCents(draft.priceCents),
    category: draft.category.trim() ? draft.category.trim() : null,
    imageUrl: draft.imageUrl.trim() ? draft.imageUrl.trim() : null,
    isAvailable: draft.isAvailable
  };
}

function ProductEditor({ product, token, onChanged }: ProductEditorProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [priceCents, setPriceCents] = useState(String(product.priceCents));
  const [category, setCategory] = useState(product.category ?? "");
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [isAvailable, setIsAvailable] = useState(product.isAvailable);

  useEffect(() => {
    setName(product.name);
    setDescription(product.description);
    setPriceCents(String(product.priceCents));
    setCategory(product.category ?? "");
    setImageUrl(product.imageUrl ?? "");
    setIsAvailable(product.isAvailable);
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: AdminUpdateProductInput = {
        name: name.trim(),
        description: description.trim(),
        priceCents: parsePriceCents(priceCents),
        category: category.trim() ? category.trim() : null,
        imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
        isAvailable
      };

      return adminProductsClient.update(product.id, payload, token);
    },
    onSuccess: onChanged
  });

  const deleteMutation = useMutation({
    mutationFn: async () => adminProductsClient.remove(product.id, token),
    onSuccess: onChanged
  });

  function handleDelete() {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) {
      return;
    }

    deleteMutation.mutate();
  }

  const mutationError = updateMutation.error ?? deleteMutation.error;

  return (
    <article className="card">
      <div className="admin-grid">
        <label className="admin-field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="admin-field">
          <span>Price (cents)</span>
          <input
            type="number"
            min={1}
            value={priceCents}
            onChange={(event) => setPriceCents(event.target.value)}
          />
        </label>

        <label className="admin-field admin-field-wide">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </label>

        <label className="admin-field">
          <span>Category</span>
          <input value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>

        <label className="admin-field">
          <span>Image URL</span>
          <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
        </label>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(event) => setIsAvailable(event.target.checked)}
          />
          <span>Available</span>
        </label>

        <div className="row admin-actions">
          <small className="muted">{product.slug}</small>
          <div className="row">
            <button
              type="button"
              className="secondary danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending || updateMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => updateMutation.mutate()}
              disabled={deleteMutation.isPending || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {mutationError ? (
        <p className="admin-error">
          {(mutationError as ApiClientError)?.message ?? "Failed to update product"}
        </p>
      ) : null}
    </article>
  );
}

function CreateProductForm({ token, onCreated }: CreateProductFormProps) {
  const [draft, setDraft] = useState<ProductDraft>(emptyCreateDraft);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = normalizeProductPayload(draft);
      if (!payload.name || !payload.description) {
        throw new Error("Name and description are required");
      }

      return adminProductsClient.create(payload, token);
    },
    onSuccess: () => {
      setDraft(emptyCreateDraft);
      onCreated();
    }
  });

  function setField<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((previous) => ({
      ...previous,
      [key]: value
    }));
  }

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Create product</h2>
      <div className="admin-grid">
        <label className="admin-field">
          <span>Name</span>
          <input value={draft.name} onChange={(event) => setField("name", event.target.value)} />
        </label>

        <label className="admin-field">
          <span>Price (cents)</span>
          <input
            type="number"
            min={1}
            value={draft.priceCents}
            onChange={(event) => setField("priceCents", event.target.value)}
          />
        </label>

        <label className="admin-field admin-field-wide">
          <span>Description</span>
          <textarea
            value={draft.description}
            onChange={(event) => setField("description", event.target.value)}
            rows={3}
          />
        </label>

        <label className="admin-field">
          <span>Category</span>
          <input
            value={draft.category}
            onChange={(event) => setField("category", event.target.value)}
          />
        </label>

        <label className="admin-field">
          <span>Image URL</span>
          <input
            value={draft.imageUrl}
            onChange={(event) => setField("imageUrl", event.target.value)}
          />
        </label>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={draft.isAvailable}
            onChange={(event) => setField("isAvailable", event.target.checked)}
          />
          <span>Available</span>
        </label>

        <div className="row admin-actions">
          <small className="muted">Slug is generated automatically from name</small>
          <button
            type="button"
            className="primary"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      {createMutation.isError ? (
        <p className="admin-error">
          {(createMutation.error as ApiClientError)?.message ?? "Failed to create product"}
        </p>
      ) : null}
    </section>
  );
}

export function AdminProductsPanel() {
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState<"all" | "available" | "unavailable">("all");
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = window.localStorage.getItem("admin_api_token");
    if (storedToken) {
      setToken(storedToken);
      setTokenDraft(storedToken);
    }
  }, []);

  const availabilityParam = useMemo(() => {
    if (availability === "available") {
      return true;
    }
    if (availability === "unavailable") {
      return false;
    }
    return undefined;
  }, [availability]);

  const listParams = useMemo(
    () => ({
      q: query || undefined,
      category: category || undefined,
      isAvailable: availabilityParam
    }),
    [query, category, availabilityParam]
  );

  const productsQuery = useApiPaginatedCached<
    Product,
    { q?: string; category?: string; isAvailable?: boolean }
  >({
    queryKey: ["admin-products", token],
    queryFn: (input) =>
      adminProductsClient.list(
        {
          page: input.page,
          pageSize: input.pageSize,
          q: input.q,
          category: input.category,
          isAvailable: input.isAvailable
        },
        token
      ),
    params: listParams,
    page,
    pageSize: 12,
    enabled: token.length > 0
  });

  function applyToken() {
    const next = tokenDraft.trim();
    setToken(next);
    setPage(1);
    if (next) {
      window.localStorage.setItem("admin_api_token", next);
    } else {
      window.localStorage.removeItem("admin_api_token");
    }
  }

  function refreshList() {
    queryClient.invalidateQueries({ queryKey: ["admin-products", token] });
  }

  const isUnauthorized =
    productsQuery.error instanceof ApiClientError && productsQuery.error.status === 401;

  return (
    <main>
      <h1>Admin Products</h1>
      <p className="muted">Manage catalog items, create new products, and delete old ones.</p>

      <section className="card" style={{ marginBottom: "1rem" }}>
        <div className="admin-token">
          <label className="admin-field admin-field-wide">
            <span>Admin token</span>
            <input
              type="password"
              value={tokenDraft}
              onChange={(event) => setTokenDraft(event.target.value)}
              placeholder="Paste ADMIN_API_TOKEN"
            />
          </label>
          <button className="primary" type="button" onClick={applyToken}>
            Unlock
          </button>
        </div>
      </section>

      {token ? <CreateProductForm token={token} onCreated={refreshList} /> : null}

      {token ? (
        <section className="card" style={{ marginBottom: "1rem" }}>
          <div className="admin-filters">
            <label className="admin-field">
              <span>Search</span>
              <input
                value={query}
                onChange={(event) => {
                  setPage(1);
                  setQuery(event.target.value);
                }}
                placeholder="Name or description"
              />
            </label>

            <label className="admin-field">
              <span>Category</span>
              <input
                value={category}
                onChange={(event) => {
                  setPage(1);
                  setCategory(event.target.value);
                }}
                placeholder="cookies"
              />
            </label>

            <label className="admin-field">
              <span>Availability</span>
              <select
                value={availability}
                onChange={(event) => {
                  setPage(1);
                  setAvailability(event.target.value as "all" | "available" | "unavailable");
                }}
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>
          </div>
        </section>
      ) : null}

      {!token ? <p>Enter an admin token to view products.</p> : null}
      {token && productsQuery.isLoading ? <p>Loading products...</p> : null}
      {token && isUnauthorized ? <p className="admin-error">Invalid admin token.</p> : null}
      {token && productsQuery.isError && !isUnauthorized ? (
        <p className="admin-error">Could not load admin products.</p>
      ) : null}

      <section className="card-grid">
        {productsQuery.data?.items.map((product) => (
          <ProductEditor key={product.id} product={product} token={token} onChanged={refreshList} />
        ))}
      </section>

      {token && productsQuery.data ? (
        <section className="row" style={{ marginTop: "1rem" }}>
          <button
            className="secondary"
            type="button"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
          >
            Previous
          </button>
          <p>
            Page {productsQuery.data.page} / {productsQuery.data.totalPages}
          </p>
          <button
            className="secondary"
            type="button"
            onClick={() => setPage((previous) => previous + 1)}
            disabled={productsQuery.data.page >= productsQuery.data.totalPages}
          >
            Next
          </button>
        </section>
      ) : null}
    </main>
  );
}
