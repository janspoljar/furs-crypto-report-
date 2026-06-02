import { TableSkeleton } from "@/components/skeletons";

export default function TransactionsLoading() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <div className="skeleton-line" style={{ width: 200, height: 36, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: 320, height: 16 }} />
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        <div className="admin-stats" style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-stat">
              <div className="skeleton-line" style={{ width: 80, height: 12, marginBottom: 8 }} />
              <div className="skeleton-line" style={{ width: 100, height: 36 }} />
            </div>
          ))}
        </div>
        <TableSkeleton rows={10} />
      </section>
    </main>
  );
}
