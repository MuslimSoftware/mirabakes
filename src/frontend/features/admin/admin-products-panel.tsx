"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type AdminCreateProductInput,
  type AdminUpdateProductInput,
  adminProductsClient
} from "@/frontend/api/clients/admin-products.client";
import { uploadsClient } from "@/frontend/api/clients/uploads.client";
import { ApiClientError } from "@/frontend/api/http/client";
import { useApiPaginatedCached } from "@/frontend/hooks/useApiPaginatedCached";
import type { Product } from "@/shared/types/domain";

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

function ImageUploadField({
  imageUrl,
  onImageUrlChange,
  token
}: {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  token: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadsClient.uploadImage(file, token),
    onSuccess: (data) => onImageUrlChange(data.url)
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    event.target.value = "";
  }

  return (
    <div className="admin-field admin-field-wide">
      <span>Image</span>
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <input
          value={imageUrl}
          onChange={(event) => onImageUrlChange(event.target.value)}
          placeholder="URL or upload"
          style={{ flex: 1 }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
        >
          {uploadMutation.isPending ? "..." : "Upload"}
        </button>
      </div>
      {uploadMutation.isError ? (
        <small style={{ color: "var(--color-danger, red)" }}>
          {(uploadMutation.error as ApiClientError)?.message ?? "Upload failed"}
        </small>
      ) : null}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Preview"
          style={{ marginTop: "0.25rem", maxHeight: "64px", borderRadius: "4px", objectFit: "cover" }}
        />
      ) : null}
    </div>
  );
}

function EditProductForm({
  product,
  token,
  onSaved,
  onCancel
}: {
  product: Product;
  token: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
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
    onSuccess: onSaved
  });

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h3 style={{ marginBottom: "0.5rem" }}>Edit: {product.name}</h3>
      <div className="admin-grid">
        <label className="admin-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Price (cents)</span>
          <input type="number" min={1} value={priceCents} onChange={(e) => setPriceCents(e.target.value)} />
        </label>
        <label className="admin-field admin-field-wide">
          <span>Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <ImageUploadField imageUrl={imageUrl} onImageUrlChange={setImageUrl} token={token} />
        <label className="admin-checkbox">
          <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
          <span>Available</span>
        </label>
        <div className="row admin-actions">
          <small className="muted">{product.slug}</small>
          <div className="row">
            <button type="button" className="secondary" onClick={onCancel} disabled={updateMutation.isPending}>
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
      {updateMutation.isError ? (
        <p className="admin-error">
          {(updateMutation.error as ApiClientError)?.message ?? "Failed to update product"}
        </p>
      ) : null}
    </section>
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
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Create product</h2>
      <div className="admin-grid">
        <label className="admin-field">
          <span>Name</span>
          <input value={draft.name} onChange={(e) => setField("name", e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Price (cents)</span>
          <input type="number" min={1} value={draft.priceCents} onChange={(e) => setField("priceCents", e.target.value)} />
        </label>
        <label className="admin-field admin-field-wide">
          <span>Description</span>
          <textarea value={draft.description} onChange={(e) => setField("description", e.target.value)} rows={3} />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <input value={draft.category} onChange={(e) => setField("category", e.target.value)} />
        </label>
        <ImageUploadField imageUrl={draft.imageUrl} onImageUrlChange={(url) => setField("imageUrl", url)} token={token} />
        <label className="admin-checkbox">
          <input type="checkbox" checked={draft.isAvailable} onChange={(e) => setField("isAvailable", e.target.checked)} />
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

export function AdminProductsPanel({ token }: { token: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState<"all" | "available" | "unavailable">("all");
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  const availabilityParam = useMemo(() => {
    if (availability === "available") return true;
    if (availability === "unavailable") return false;
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
        { page: input.page, pageSize: input.pageSize, q: input.q, category: input.category, isAvailable: input.isAvailable },
        token
      ),
    params: listParams,
    page,
    pageSize: 12,
    enabled: token.length > 0
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminProductsClient.remove(id, token),
    onSuccess: refreshList
  });

  function refreshList() {
    queryClient.invalidateQueries({ queryKey: ["admin-products", token] });
  }

  function handleCreated() {
    setShowCreate(false);
    refreshList();
  }

  function handleEditSaved() {
    setEditingProductId(null);
    refreshList();
  }

  function handleDelete(product: Product) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    deleteMutation.mutate(product.id);
  }

  const editingProduct = editingProductId
    ? productsQuery.data?.items.find((p) => p.id === editingProductId)
    : null;

  const isUnauthorized =
    productsQuery.error instanceof ApiClientError && productsQuery.error.status === 401;

  return (
    <div>
      {!showCreate ? (
        <div style={{ marginBottom: "1rem" }}>
          <button className="primary" type="button" onClick={() => setShowCreate(true)}>
            Create Product
          </button>
        </div>
      ) : null}

      {showCreate ? <CreateProductForm token={token} onCreated={handleCreated} /> : null}

      {editingProduct ? (
        <EditProductForm
          product={editingProduct}
          token={token}
          onSaved={handleEditSaved}
          onCancel={() => setEditingProductId(null)}
        />
      ) : null}

      <section className="card" style={{ marginBottom: "1rem" }}>
        <div className="admin-filters">
          <label className="admin-field">
            <span>Search</span>
            <input
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
              placeholder="Name or description"
            />
          </label>
          <label className="admin-field">
            <span>Category</span>
            <input
              value={category}
              onChange={(e) => { setPage(1); setCategory(e.target.value); }}
              placeholder="cookies"
            />
          </label>
          <label className="admin-field">
            <span>Availability</span>
            <select
              value={availability}
              onChange={(e) => { setPage(1); setAvailability(e.target.value as "all" | "available" | "unavailable"); }}
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
        </div>
      </section>

      {productsQuery.isLoading ? <p>Loading products...</p> : null}
      {isUnauthorized ? <p className="admin-error">Invalid admin token.</p> : null}
      {productsQuery.isError && !isUnauthorized ? (
        <p className="admin-error">Could not load admin products.</p>
      ) : null}

      {productsQuery.data && productsQuery.data.items.length > 0 ? (
        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th className="text-right">Price</th>
                <th>Status</th>
                <th style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.data.items.map((product) => (
                <tr
                  key={product.id}
                  style={editingProductId === product.id ? { background: "rgba(199,109,58,0.06)" } : undefined}
                >
                  <td>
                    {product.imageUrl ? (
                      <img className="thumb" src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="thumb-placeholder" />
                    )}
                  </td>
                  <td><strong>{product.name}</strong></td>
                  <td className="muted">{product.category ?? "—"}</td>
                  <td className="text-right">${(product.priceCents / 100).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${product.isAvailable ? "badge-available" : "badge-unavailable"}`}>
                      {product.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setEditingProductId(product.id)}
                        title="Edit"
                        style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem" }}
                      >
                        &#9998;
                      </button>
                      <button
                        type="button"
                        className="secondary danger"
                        onClick={() => handleDelete(product)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                        style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem" }}
                      >
                        {deleteMutation.isPending ? "..." : "\u2715"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {deleteMutation.isError ? (
        <p className="admin-error">
          {(deleteMutation.error as ApiClientError)?.message ?? "Failed to delete product"}
        </p>
      ) : null}

      {productsQuery.data && productsQuery.data.totalPages > 1 ? (
        <section className="row row-responsive" style={{ marginTop: "1rem" }}>
          <button
            className="secondary"
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <p>
            Page {productsQuery.data.page} / {productsQuery.data.totalPages}
          </p>
          <button
            className="secondary"
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={productsQuery.data.page >= productsQuery.data.totalPages}
          >
            Next
          </button>
        </section>
      ) : null}
    </div>
  );
}
