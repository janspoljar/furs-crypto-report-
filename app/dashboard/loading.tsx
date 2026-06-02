import { StatsSkeleton, CardSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <div className="skeleton-line" style={{ width: 200, height: 36, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: 400, height: 16 }} />
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        {/* Stats row */}
        <div style={{ marginBottom: 32 }}>
          <StatsSkeleton />
        </div>

        {/* P&L po letih card placeholder */}
        <div
          className="card"
          style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div className="skeleton-line" style={{ width: 120, height: 18, marginBottom: 4 }} />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="skeleton-line" style={{ width: 48, height: 16 }} />
              <div className="skeleton-line" style={{ flex: 1, height: 28, borderRadius: 6 }} />
              <div className="skeleton-line" style={{ width: 80, height: 16 }} />
            </div>
          ))}
        </div>

        {/* Top gainers / losers — two cards side by side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="skeleton-line" style={{ width: 120, height: 16, marginBottom: 6 }} />
              {Array.from({ length: 5 }, (_, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="skeleton-line" style={{ width: 20, height: 14 }} />
                  <div className="skeleton-line" style={{ flex: 1, height: 14 }} />
                  <div className="skeleton-line" style={{ width: 70, height: 14 }} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Quick links card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skeleton-line" style={{ width: 100, height: 16 }} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="skeleton-line"
                style={{ width: 110, height: 36, borderRadius: "var(--r-sm)" }}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
