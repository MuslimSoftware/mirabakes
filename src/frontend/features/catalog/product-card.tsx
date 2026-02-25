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
  const hasDetails = Boolean(product.amount || product.size || product.calories);

  return (
    <article className="card product-card">
      {product.imageUrl ? (
        <img className="product-image" src={product.imageUrl} alt={product.name} loading="lazy" />
      ) : null}
      <h3>{product.name}</h3>
      {hasDetails ? (
        <div className="product-details">
          {product.amount ? <p><strong>Amount:</strong> {product.amount}</p> : null}
          {product.size ? <p><strong>Size:</strong> {product.size}</p> : null}
          {product.calories ? <p><strong>Calories:</strong> {product.calories} kcal</p> : null}
        </div>
      ) : null}
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
