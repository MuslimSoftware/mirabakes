import type { Product } from "@/shared/types/domain";

export function ProductCard({
  product,
  quantity,
  onAdd,
  onRemove
}: {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="card product-card">
      {product.imageUrl ? (
        <img className="product-image" src={product.imageUrl} alt={product.name} loading="lazy" />
      ) : null}
      <h3>{product.name}</h3>
      <p className="muted" style={{ flex: 1 }}>{product.description}</p>
      <div className="row">
        <span className="product-price">${(product.priceCents / 100).toFixed(2)}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="qty-btn" onClick={onRemove} disabled={quantity < 1} type="button">
            &minus;
          </button>
          <span className="qty-display">{quantity}</span>
          <button className="qty-btn" onClick={onAdd} type="button">
            +
          </button>
        </div>
      </div>
    </article>
  );
}
