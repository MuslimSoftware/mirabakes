"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { checkoutClient } from "@/frontend/api/clients/checkout.client";
import { productsClient } from "@/frontend/api/clients/products.client";
import { CartSummary } from "@/frontend/features/cart/cart-summary";
import { ProductCard } from "@/frontend/features/catalog/product-card";
import { useApiPaginatedCached } from "@/frontend/hooks/useApiPaginatedCached";

export default function StorePage() {
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<Record<string, { quantity: number; unitPriceCents: number }>>({});

  const productsQuery = useApiPaginatedCached({
    queryKey: ["products"],
    queryFn: productsClient.list,
    page,
    pageSize: 12
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(cart)
        .filter(([, line]) => line.quantity > 0)
        .map(([productId, line]) => ({ productId, quantity: line.quantity }));

      return checkoutClient.createSession({ items });
    },
    onSuccess: (result) => {
      window.location.assign(result.checkoutUrl);
    }
  });

  const subtotalCents = useMemo(() => {
    return Object.values(cart).reduce((sum, line) => {
      return sum + line.unitPriceCents * line.quantity;
    }, 0);
  }, [cart]);

  const totalItems = useMemo(
    () => Object.values(cart).reduce((sum, line) => sum + line.quantity, 0),
    [cart]
  );

  function addToCart(productId: string, unitPriceCents: number) {
    setCart((prev) => ({
      ...prev,
      [productId]: {
        quantity: (prev[productId]?.quantity ?? 0) + 1,
        unitPriceCents
      }
    }));
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const nextValue = Math.max(0, (prev[productId]?.quantity ?? 0) - 1);
      if (nextValue === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [productId]: {
          quantity: nextValue,
          unitPriceCents: prev[productId]!.unitPriceCents
        }
      };
    });
  }

  return (
    <main>
      <h1>Mira Bakes</h1>
      <p className="muted">Fresh baked goods, simple ordering, secure checkout.</p>

      {productsQuery.isLoading ? <p>Loading products...</p> : null}
      {productsQuery.isError ? <p>Could not load products.</p> : null}

      <section className="card-grid" style={{ marginTop: "1rem" }}>
        {productsQuery.data?.items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={cart[product.id]?.quantity ?? 0}
            onAdd={() => addToCart(product.id, product.priceCents)}
            onRemove={() => removeFromCart(product.id)}
          />
        ))}
      </section>

      <section className="row" style={{ marginTop: "1rem" }}>
        <button className="secondary" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </button>
        <p>
          Page {productsQuery.data?.page ?? 1} / {productsQuery.data?.totalPages ?? 1}
        </p>
        <button
          className="secondary"
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={
            productsQuery.data ? productsQuery.data.page >= productsQuery.data.totalPages : false
          }
        >
          Next
        </button>
      </section>

      <CartSummary
        totalItems={totalItems}
        subtotalCents={subtotalCents}
        loading={checkoutMutation.isPending}
        onCheckout={() => checkoutMutation.mutate()}
      />
    </main>
  );
}
