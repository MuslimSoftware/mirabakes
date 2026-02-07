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
        <strong>${(product.priceCents / 100).toFixed(2)}</strong>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <button className="secondary" onClick={onRemove} disabled={quantity < 1} type="button">
            -
          </button>
          <span>{quantity}</span>
          <button className="secondary" onClick={onAdd} type="button">
            +
          </button>
        </div>
      </div>
    </article>
  );
}
