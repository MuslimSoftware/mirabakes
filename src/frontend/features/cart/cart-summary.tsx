export type CartLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export function CartSummary({
  lines,
  totalItems,
  subtotalCents,
  onCheckout,
  loading,
  phone,
  onPhoneChange
}: {
  lines: CartLine[];
  totalItems: number;
  subtotalCents: number;
  onCheckout: () => void;
  loading: boolean;
  phone: string;
  onPhoneChange: (value: string) => void;
}) {
  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <h3>Cart</h3>

      {totalItems === 0 ? (
        <p className="muted">Your cart is empty. Add items above to get started.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0" }}>
            {lines.map((line) => (
              <li key={line.name} className="row" style={{ padding: "0.25rem 0" }}>
                <span>
                  {line.name} &times; {line.quantity}
                </span>
                <strong>${((line.unitPriceCents * line.quantity) / 100).toFixed(2)}</strong>
              </li>
            ))}
          </ul>

          <div className="row" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
            <span className="muted">{totalItems} item(s)</span>
            <strong>${(subtotalCents / 100).toFixed(2)}</strong>
          </div>

          <label style={{ display: "block", marginTop: "0.5rem" }}>
            <span className="muted" style={{ fontSize: "0.85rem" }}>Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+1 (555) 123-4567"
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>
        </>
      )}

      <button
        className="primary"
        type="button"
        onClick={onCheckout}
        disabled={totalItems === 0 || !phone.trim() || loading}
        style={{ width: "100%", marginTop: "0.5rem" }}
      >
        {loading ? "Redirecting..." : "Checkout"}
      </button>
    </section>
  );
}
