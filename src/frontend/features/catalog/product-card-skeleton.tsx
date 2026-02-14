export function ProductCardSkeleton() {
  return (
    <article className="card product-card">
      <div className="skeleton" style={{ width: "100%", height: 160, borderRadius: 12 }} />
      <div className="skeleton" style={{ width: "60%", height: 20, marginTop: "0.85rem" }} />
      <div className="skeleton" style={{ width: "100%", height: 14, marginTop: "0.5rem" }} />
      <div className="skeleton" style={{ width: "80%", height: 14, marginTop: "0.25rem" }} />
      <div style={{ flex: 1 }} />
      <div className="row" style={{ marginTop: "0.75rem" }}>
        <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 6 }} />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 24, height: 32, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
        </div>
      </div>
    </article>
  );
}
