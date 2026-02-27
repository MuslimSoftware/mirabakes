"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useRef, useState } from "react";

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
  amount: string;
  size: string;
  calories: string;
  category: string;
  isAvailable: boolean;
};

const emptyCreateDraft: ProductDraft = {
  name: "",
  description: "",
  priceCents: "",
  amount: "",
  size: "",
  calories: "",
  category: "",
  isAvailable: true
};

function parsePriceCents(value: string): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new Error("Price must be a positive integer in cents");
  }

  return numeric;
}

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseOptionalCalories(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new Error("Calories must be a positive integer");
  }

  return numeric;
}

function normalizeProductPayload(draft: ProductDraft): AdminCreateProductInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    priceCents: parsePriceCents(draft.priceCents),
    amount: normalizeOptionalText(draft.amount),
    size: normalizeOptionalText(draft.size),
    calories: parseOptionalCalories(draft.calories),
    category: normalizeOptionalText(draft.category),
    isAvailable: draft.isAvailable
  };
}

type ImageGalleryFieldProps = {
  productId: string | null;
  imageUrls: string[];
  token: string;
  onImagesChanged: () => void;
};

type PendingImage = {
  file: File;
  previewUrl: string;
};

function ImageGalleryField({ productId, imageUrls, token, onImagesChanged }: ImageGalleryFieldProps) {
  const fileInputId = useId();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pendingImagesRef = useRef<PendingImage[]>([]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      for (const img of pendingImagesRef.current) {
        URL.revokeObjectURL(img.previewUrl);
      }
    };
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (productId) {
      setIsUploading(true);
      setUploadError(null);
      try {
        await uploadsClient.uploadImage(file, productId, token);
        onImagesChanged();
      } catch (err) {
        setUploadError(err instanceof ApiClientError ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    } else {
      const previewUrl = URL.createObjectURL(file);
      setPendingImages((prev) => [...prev, { file, previewUrl }]);
    }
  }

  async function handleRemoveExisting(imageUrl: string) {
    if (!productId) return;
    const imageId = imageUrl.split("/").pop();
    if (!imageId) return;
    setUploadError(null);
    try {
      await adminProductsClient.deleteImage(productId, imageId, token);
      onImagesChanged();
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : "Delete failed");
    }
  }

  function handleRemovePending(index: number) {
    setPendingImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  const allPreviews = [
    ...imageUrls.map((url) => ({ url, isPending: false, index: -1 })),
    ...pendingImages.map((img, i) => ({ url: img.previewUrl, isPending: true, index: i }))
  ];

  return (
    <div className="admin-field admin-field-wide">
      <span>Images</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {allPreviews.map(({ url, isPending, index }) => (
          <div
            key={url}
            style={{ position: "relative", display: "inline-block" }}
          >
            <img
              src={url}
              alt="Product image"
              style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4, display: "block" }}
            />
            <button
              type="button"
              onClick={() => isPending ? handleRemovePending(index) : handleRemoveExisting(url)}
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "none",
                background: "var(--color-danger, red)",
                color: "#fff",
                fontSize: 11,
                lineHeight: "18px",
                textAlign: "center",
                cursor: "pointer",
                padding: 0
              }}
              title="Remove image"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none"
        }}
      />
      <label
        htmlFor={fileInputId}
        className="secondary"
        aria-disabled={isUploading}
        onClick={(event) => {
          if (isUploading) event.preventDefault();
        }}
        style={{
          display: "inline-block",
          padding: "0.3rem 0.5rem",
          fontSize: "0.85rem",
          whiteSpace: "nowrap",
          opacity: isUploading ? 0.6 : 1,
          pointerEvents: isUploading ? "none" : "auto",
          cursor: "pointer"
        }}
      >
        {isUploading ? "Uploading..." : "+ Add image"}
      </label>
      {uploadError ? (
        <small style={{ color: "var(--color-danger, red)", display: "block", marginTop: "0.25rem" }}>
          {uploadError}
        </small>
      ) : null}
    </div>
  );
}

type ImageGalleryFieldHandle = {
  getPendingFiles: () => File[];
  isUploading: boolean;
};

function ImageGalleryFieldWithRef({
  imageUrls,
  handleRef
}: Pick<ImageGalleryFieldProps, "imageUrls"> & { handleRef: React.MutableRefObject<ImageGalleryFieldHandle | null> }) {
  const fileInputId = useId();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingImagesRef = useRef<PendingImage[]>([]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    handleRef.current = {
      getPendingFiles: () => pendingImagesRef.current.map((img) => img.file),
      isUploading: false
    };
  }, [handleRef]);

  useEffect(() => {
    return () => {
      for (const img of pendingImagesRef.current) {
        URL.revokeObjectURL(img.previewUrl);
      }
    };
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPendingImages((prev) => [...prev, { file, previewUrl }]);
  }

  function handleRemovePending(index: number) {
    setPendingImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  const allPreviews = [
    ...imageUrls.map((url) => ({ url, isPending: false, index: -1 })),
    ...pendingImages.map((img, i) => ({ url: img.previewUrl, isPending: true, index: i }))
  ];

  return (
    <div className="admin-field admin-field-wide">
      <span>Images</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {allPreviews.map(({ url, isPending, index }) => (
          <div
            key={url}
            style={{ position: "relative", display: "inline-block" }}
          >
            <img
              src={url}
              alt="Product image"
              style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4, display: "block" }}
            />
            {isPending ? (
              <button
                type="button"
                onClick={() => handleRemovePending(index)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "none",
                  background: "var(--color-danger, red)",
                  color: "#fff",
                  fontSize: 11,
                  lineHeight: "18px",
                  textAlign: "center",
                  cursor: "pointer",
                  padding: 0
                }}
                title="Remove image"
              >
                &times;
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none"
        }}
      />
      <label
        htmlFor={fileInputId}
        className="secondary"
        style={{
          display: "inline-block",
          padding: "0.3rem 0.5rem",
          fontSize: "0.85rem",
          whiteSpace: "nowrap",
          cursor: "pointer"
        }}
      >
        + Add image
      </label>
    </div>
  );
}

function EditProductForm({
  product,
  token,
  onSaved,
  onCancel,
  onImagesChanged
}: {
  product: Product;
  token: string;
  onSaved: () => void;
  onCancel: () => void;
  onImagesChanged: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [priceCents, setPriceCents] = useState(String(product.priceCents));
  const [amount, setAmount] = useState(product.amount ?? "");
  const [size, setSize] = useState(product.size ?? "");
  const [calories, setCalories] = useState(product.calories ? String(product.calories) : "");
  const [category, setCategory] = useState(product.category ?? "");
  const [isAvailable, setIsAvailable] = useState(product.isAvailable);

  useEffect(() => {
    setName(product.name);
    setDescription(product.description);
    setPriceCents(String(product.priceCents));
    setAmount(product.amount ?? "");
    setSize(product.size ?? "");
    setCalories(product.calories ? String(product.calories) : "");
    setCategory(product.category ?? "");
    setIsAvailable(product.isAvailable);
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: AdminUpdateProductInput = {
        name: name.trim(),
        description: description.trim(),
        priceCents: parsePriceCents(priceCents),
        amount: normalizeOptionalText(amount),
        size: normalizeOptionalText(size),
        calories: parseOptionalCalories(calories),
        category: normalizeOptionalText(category),
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
        <label className="admin-field">
          <span>Amount (optional)</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="12 pieces" />
        </label>
        <label className="admin-field">
          <span>Size (optional)</span>
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="8-inch (serves 10)" />
        </label>
        <label className="admin-field">
          <span>Calories (optional)</span>
          <input type="number" min={1} value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="320" />
        </label>
        <label className="admin-field admin-field-wide">
          <span>Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <ImageGalleryField
          productId={product.id}
          imageUrls={product.imageUrls ?? []}
          token={token}
          onImagesChanged={onImagesChanged}
        />
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
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const galleryRef = useRef<ImageGalleryFieldHandle | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = normalizeProductPayload(draft);
      if (!payload.name || !payload.description) {
        throw new Error("Name and description are required");
      }
      const product = await adminProductsClient.create(payload, token);

      const pendingFiles = galleryRef.current?.getPendingFiles() ?? [];
      if (pendingFiles.length > 0) {
        setIsUploadingFiles(true);
        await Promise.all(pendingFiles.map((file) => uploadsClient.uploadImage(file, product.id, token)));
        setIsUploadingFiles(false);
      }

      return product;
    },
    onSuccess: () => {
      setDraft(emptyCreateDraft);
      onCreated();
    },
    onError: () => {
      setIsUploadingFiles(false);
    }
  });

  function setField<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const isBusy = createMutation.isPending || isUploadingFiles;

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
        <label className="admin-field">
          <span>Amount (optional)</span>
          <input value={draft.amount} onChange={(e) => setField("amount", e.target.value)} placeholder="12 pieces" />
        </label>
        <label className="admin-field">
          <span>Size (optional)</span>
          <input value={draft.size} onChange={(e) => setField("size", e.target.value)} placeholder="8-inch (serves 10)" />
        </label>
        <label className="admin-field">
          <span>Calories (optional)</span>
          <input
            type="number"
            min={1}
            value={draft.calories}
            onChange={(e) => setField("calories", e.target.value)}
            placeholder="320"
          />
        </label>
        <label className="admin-field admin-field-wide">
          <span>Description</span>
          <textarea value={draft.description} onChange={(e) => setField("description", e.target.value)} rows={3} />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <input value={draft.category} onChange={(e) => setField("category", e.target.value)} />
        </label>
        <ImageGalleryFieldWithRef
          imageUrls={[]}
          handleRef={galleryRef}
        />
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
            disabled={isBusy}
          >
            {isUploadingFiles ? "Uploading images..." : createMutation.isPending ? "Creating..." : "Create"}
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
    if (!window.confirm(`Delete ${product.name}? Products with order history are archived automatically.`)) return;
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
          onImagesChanged={refreshList}
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
              {productsQuery.data.items.map((product) => {
                const thumbUrl = product.imageUrls?.[0] ?? product.imageUrl;
                return (
                  <tr
                    key={product.id}
                    style={editingProductId === product.id ? { background: "rgba(199,109,58,0.06)" } : undefined}
                  >
                    <td>
                      {thumbUrl ? (
                        <img className="thumb" src={thumbUrl} alt={product.name} />
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
                );
              })}
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
