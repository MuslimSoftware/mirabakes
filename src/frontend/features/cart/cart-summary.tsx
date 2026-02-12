import { useState } from "react";

export type CartLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function extractDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhone(value: string): boolean {
  return extractDigits(value).length === 10;
}

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
  const [touched, setTouched] = useState(false);
  const digits = extractDigits(phone);
  const showError = touched && digits.length > 0 && digits.length < 10;

  function handlePhoneChange(raw: string) {
    onPhoneChange(formatPhoneNumber(raw));
  }

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

          <div style={{ marginTop: "0.75rem", maxWidth: "50%" }}>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Phone number <span style={{ color: "var(--error, #d32f2f)" }}>*</span></span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", flexShrink: 0 }}>+1</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="(555) 123-4567"
                  aria-invalid={showError}
                  style={{
                    width: "100%",
                    borderColor: showError ? "var(--error, #d32f2f)" : undefined
                  }}
                />
              </div>
            </label>
            {showError && (
              <p style={{ color: "var(--error, #d32f2f)", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                Enter a valid 10-digit phone number.
              </p>
            )}
          </div>
        </>
      )}

      <button
        className="primary"
        type="button"
        onClick={onCheckout}
        disabled={totalItems === 0 || !isValidPhone(phone) || loading}
        style={{ width: "100%", marginTop: "0.75rem" }}
      >
        {loading ? "Redirecting..." : "Checkout"}
      </button>
    </section>
  );
}
