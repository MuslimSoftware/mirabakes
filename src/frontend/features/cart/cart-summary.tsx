export function CartSummary({
  totalItems,
  subtotalCents,
  onCheckout,
  loading
}: {
  totalItems: number;
  subtotalCents: number;
  onCheckout: () => void;
  loading: boolean;
}) {
  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <div className="row">
        <div>
          <h3>Cart</h3>
          <p className="muted">{totalItems} item(s)</p>
        </div>
        <div>
          <strong>${(subtotalCents / 100).toFixed(2)}</strong>
        </div>
      </div>
      <button className="primary" type="button" onClick={onCheckout} disabled={totalItems === 0 || loading}>
        {loading ? "Redirecting..." : "Checkout"}
      </button>
    </section>
  );
}
