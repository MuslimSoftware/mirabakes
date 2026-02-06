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
    <article className="card">
      <h3>{product.name}</h3>
      <p className="muted">{product.description}</p>
      <div className="row">
        <strong>${(product.priceCents / 100).toFixed(2)}</strong>
        <div className="row">
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
