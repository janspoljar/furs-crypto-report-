import { CardSkeleton, StatsSkeleton } from "@/components/skeletons";

export default function ReportsLoading() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <div
            className="row between"
            style={{ flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}
          >
            <div>
              <div className="skeleton-line" style={{ width: 220, height: 36, marginBottom: 8 }} />
              <div className="skeleton-line" style={{ width: 360, height: 16 }} />
            </div>
            <div className="skeleton-line" style={{ width: 160, height: 36, borderRadius: "var(--r-sm)" }} />
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        {/* Stats summary */}
        <StatsSkeleton />

        {/* Year cards heading */}
        <div className="skeleton-line" style={{ width: 340, height: 18, margin: "28px 0 14px" }} />

        {/* Report cards */}
        <CardSkeleton count={3} />
      </section>
    </main>
  );
}
