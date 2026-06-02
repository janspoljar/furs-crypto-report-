export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  const colWidths = [100, 60, 80, 80, 80, 70, 120];

  return (
    <div className="tbl-wrap">
      <table className="skeleton-table">
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              {colWidths.map((w, j) => (
                <td key={j}>
                  <div className="skeleton-line" style={{ width: w, height: 18 }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="report-grid">
      {Array.from({ length: count }, (_, i) => (
        <article className="report-card" key={i}>
          {/* Top row: year + badge */}
          <div className="top">
            <div className="skeleton-line" style={{ width: 48, height: 44 }} />
            <div className="skeleton-line" style={{ width: 80, height: 22, borderRadius: 20 }} />
          </div>

          {/* First grid-2 row */}
          <div className="grid-2">
            <div>
              <div className="skeleton-line k" style={{ width: 60, height: 11, marginBottom: 8 }} />
              <div className="skeleton-line v" style={{ width: 80, height: 18 }} />
            </div>
            <div>
              <div className="skeleton-line k" style={{ width: 80, height: 11, marginBottom: 8 }} />
              <div className="skeleton-line v" style={{ width: 90, height: 18 }} />
            </div>
          </div>

          {/* Second grid-2 row */}
          <div className="grid-2" style={{ borderTop: "none", paddingTop: 0 }}>
            <div>
              <div className="skeleton-line k" style={{ width: 70, height: 11, marginBottom: 8 }} />
              <div className="skeleton-line v" style={{ width: 80, height: 18 }} />
            </div>
            <div>
              <div className="skeleton-line k" style={{ width: 60, height: 11, marginBottom: 8 }} />
              <div className="skeleton-line v" style={{ width: 40, height: 18 }} />
            </div>
          </div>

          {/* Bottom button */}
          <div className="row-actions">
            <div className="skeleton-line" style={{ height: 36, borderRadius: "var(--r-sm)" }} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="admin-stats">
      {Array.from({ length: 4 }, (_, i) => (
        <div className="admin-stat" key={i}>
          <div className="skeleton-line k" style={{ width: 80, height: 12, marginBottom: 8 }} />
          <div className="skeleton-line v" style={{ width: 60, height: 36 }} />
        </div>
      ))}
    </div>
  );
}
