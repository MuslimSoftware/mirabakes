"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { checkoutClient } from "@/frontend/api/clients/checkout.client";
import { productsClient } from "@/frontend/api/clients/products.client";
import { CartSummary, extractDigits } from "@/frontend/features/cart/cart-summary";
import { ProductCard } from "@/frontend/features/catalog/product-card";
import { ProductCardSkeleton } from "@/frontend/features/catalog/product-card-skeleton";
import { useApiPaginatedCached } from "@/frontend/hooks/useApiPaginatedCached";

export default function StorePage() {
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<Record<string, { name: string; quantity: number; unitPriceCents: number }>>({});
  const [phone, setPhone] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ urls: string[]; alt: string; index: number } | null>(null);
  const [modalIndex, setModalIndex] = useState(0);
  const modalCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedImage) return;
    setModalIndex(selectedImage.index);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedImage(null);
    }

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  useEffect(() => {
    if (!selectedImage || !modalCarouselRef.current) return;
    const track = modalCarouselRef.current;
    track.scrollTo({ left: selectedImage.index * track.clientWidth, behavior: "instant" });
  }, [selectedImage]);

  function scrollModalTo(index: number) {
    const track = modalCarouselRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    setModalIndex(index);
  }

  function handleModalScroll() {
    const track = modalCarouselRef.current;
    if (!track) return;
    setModalIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

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

      return checkoutClient.createSession({ items, customerPhone: `+1${extractDigits(phone)}` });
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

  function addToCart(productId: string, name: string, unitPriceCents: number) {
    setCart((prev) => ({
      ...prev,
      [productId]: {
        name,
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
          name: prev[productId]!.name,
          quantity: nextValue,
          unitPriceCents: prev[productId]!.unitPriceCents
        }
      };
    });
  }

  return (
    <main>
      <section className="hero">
        <h1>Mira Bakes</h1>
        <p className="subtitle">
          Handcrafted baked goods made with love. Browse our selection, add to your cart, and checkout securely.
        </p>
        <p className="muted" style={{ fontSize: "0.9rem", marginTop: "0.5rem", fontWeight: 600 }}>
          Saint-Paul, Minnesota, United States
        </p>
      </section>

      {productsQuery.isError ? <p>Could not load products.</p> : null}

      <section className="card-grid">
        {productsQuery.isLoading
          ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)
          : null}
        {productsQuery.data?.items.map((product) => {
          const images = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];

          return (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cart[product.id]?.quantity ?? 0}
              onAdd={() => addToCart(product.id, product.name, product.priceCents)}
              onRemove={() => removeFromCart(product.id)}
              onImageClick={images.length > 0 ? (index) => setSelectedImage({ urls: images, alt: product.name, index }) : undefined}
            />
          );
        })}
      </section>

      {productsQuery.data && productsQuery.data.totalPages > 1 ? (
        <section className="pagination">
          <button className="secondary" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>
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

      <CartSummary
        lines={Object.values(cart)}
        totalItems={totalItems}
        subtotalCents={subtotalCents}
        loading={checkoutMutation.isPending}
        onCheckout={() => checkoutMutation.mutate()}
        phone={phone}
        onPhoneChange={setPhone}
      />

      <footer className="store-footer">
        Mira Bakes &middot; Handcrafted with care
      </footer>

      {selectedImage ? (
        <div
          className="image-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Product image: ${selectedImage.alt}`}
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="image-modal-close"
            type="button"
            aria-label="Close image preview"
            onClick={() => setSelectedImage(null)}
          >
            &times;
          </button>

          {selectedImage.urls.length === 1 ? (
            <img
              className="image-modal-image"
              src={selectedImage.urls[0]}
              alt={selectedImage.alt}
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <>
              <div
                className="image-modal-carousel"
                ref={modalCarouselRef}
                onScroll={handleModalScroll}
                onClick={(event) => event.stopPropagation()}
              >
                {selectedImage.urls.map((src, i) => (
                  <img key={i} src={src} alt={`${selectedImage.alt} ${i + 1}`} />
                ))}
              </div>

              {modalIndex > 0 ? (
                <button
                  className="image-modal-nav prev"
                  type="button"
                  aria-label="Previous image"
                  onClick={(event) => { event.stopPropagation(); scrollModalTo(modalIndex - 1); }}
                >
                  &#8249;
                </button>
              ) : null}

              {modalIndex < selectedImage.urls.length - 1 ? (
                <button
                  className="image-modal-nav next"
                  type="button"
                  aria-label="Next image"
                  onClick={(event) => { event.stopPropagation(); scrollModalTo(modalIndex + 1); }}
                >
                  &#8250;
                </button>
              ) : null}

              <div className="image-modal-dots">
                {selectedImage.urls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`carousel-dot${i === modalIndex ? " active" : ""}`}
                    aria-label={`Go to image ${i + 1}`}
                    onClick={(event) => { event.stopPropagation(); scrollModalTo(i); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </main>
  );
}
