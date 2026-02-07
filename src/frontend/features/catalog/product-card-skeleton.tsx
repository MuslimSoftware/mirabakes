export function ProductCardSkeleton() {
  return (
    <article className="card product-card">
      <div className="skeleton" style={{ width: "100%", height: 140, borderRadius: 10 }} />
      <div className="skeleton" style={{ width: "60%", height: 20, marginTop: "0.75rem" }} />
      <div className="skeleton" style={{ width: "100%", height: 14, marginTop: "0.5rem" }} />
      <div className="skeleton" style={{ width: "80%", height: 14, marginTop: "0.25rem" }} />
      <div style={{ flex: 1 }} />
      <div className="row" style={{ marginTop: "0.75rem" }}>
        <div className="skeleton" style={{ width: 50, height: 20 }} />
        <div className="skeleton" style={{ width: 90, height: 32, borderRadius: 8 }} />
      </div>
    </article>
  );
}
