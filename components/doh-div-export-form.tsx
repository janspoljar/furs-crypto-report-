"use client";

import { useState } from "react";

interface DohDivEntry {
  asset: string;
  payerName: string;
  isin: string;
  countryCode: string;
  dividendAmount: number;
  withheldTax: number;
  slovenianTaxDue: number;
  transactionCount: number;
  dates: string[];
}

interface DohDivValidation {
  success: boolean;
  year: number;
  transactionCount: number;
  entryCount: number;
  totalDividends: number;
  totalWithheld: number;
  totalSlovenianDue: number;
  hasIncompleteISIN: boolean;
  hasIncompleteCountry: boolean;
  profileComplete: boolean;
  entries: DohDivEntry[];
}

interface Props {
  availableYears: number[];
}

export default function DohDivExportForm({ availableYears }: Props) {
  const [selectedYear, setSelectedYear] = useState(availableYears[0]?.toString() ?? "");
  const [result, setResult] = useState<DohDivValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate() {
    if (!selectedYear) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/reports/doh-div?year=${selectedYear}&validate=1`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Napaka (status ${res.status})`);
        return;
      }
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? "Napaka pri preverjanju.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!selectedYear) return;
    try {
      const res = await fetch(`/api/reports/doh-div?year=${selectedYear}`);
      if (!res.ok) {
        let msg = "Prenos ni uspel.";
        try { const d = await res.json(); msg = d?.error ?? msg; } catch {}
        setError(msg);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Doh_Div_${selectedYear}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err?.message ?? "Napaka pri prenosu.");
    }
  }

  const canDownload = result && result.success && result.transactionCount > 0;

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "#333" }}>
        Izvoz DOH-DIV (dividende &amp; staking)
      </h2>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
        Obrazec za napoved dohodnine od dividend in obresti (vključno s staking nagradami).
        Oddati ga je treba ločeno od DOH-KDVP.
      </p>

      <div style={{ display: "grid", gap: 16 }}>
        {/* Opozorilo o manjkajočih podatkih */}
        <div style={{ padding: 12, backgroundColor: "#fff8e1", borderRadius: 6, border: "1px solid #ffb300", fontSize: 13, color: "#7c6a0a", lineHeight: 1.6 }}>
          <strong>⚠ Opomba za Trading212 uporabnike:</strong> Trading212 CSV pogosto ne vsebuje ISIN
          in države vira dividende. Te podatke boste morali <strong>ročno dopolniti</strong> pred
          oddajo na eDavke. ISIN delnic najdete na strani podjetja ali na{" "}
          <a href="https://www.openfigi.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#7c6a0a" }}>OpenFIGI</a> /
          <a href="https://www.isin.org/" target="_blank" rel="noopener noreferrer" style={{ color: "#7c6a0a" }}> ISIN.org</a>.
        </div>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 500, color: "#333" }}>Davčno leto</span>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setResult(null); }}
            disabled={loading}
            style={{ padding: 12, borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
          >
            <option value="">Izberi leto...</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>

        <button
          onClick={handleValidate}
          disabled={!selectedYear || loading}
          style={{
            padding: "12px 18px", borderRadius: 6, border: "none",
            backgroundColor: "#0369a1", color: "white", fontWeight: 600,
            cursor: !selectedYear || loading ? "not-allowed" : "pointer",
            opacity: !selectedYear || loading ? 0.5 : 1,
          }}
        >
          {loading ? "Preverjam..." : "Preveri dividende"}
        </button>

        {error && (
          <div style={{ padding: 12, backgroundColor: "#ffe6e6", borderRadius: 6, border: "1px solid #f57c7c", color: "#c62828", fontSize: 13 }}>
            <strong style={{ display: "block", marginBottom: 4 }}>Napaka</strong>
            {error}
          </div>
        )}

        {result && (
          <div style={{ display: "grid", gap: 16 }}>

            {result.transactionCount === 0 ? (
              <div style={{ padding: 16, backgroundColor: "#f5f5f5", borderRadius: 8, border: "1px solid #ddd", color: "#666", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontWeight: 500 }}>Ni dividend za leto {result.year}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>V uvozenih transakcijah ni evidentiranih dividend ali staking nagrad za to leto.</div>
              </div>
            ) : (
              <>
                {/* Povzetek */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  <div style={{ padding: 14, backgroundColor: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac" }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 4, textTransform: "uppercase" }}>Bruto dividende</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: "#16a34a" }}>{result.totalDividends.toFixed(2)} €</div>
                  </div>
                  <div style={{ padding: 14, backgroundColor: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa" }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 4, textTransform: "uppercase" }}>Tuji odtegnjeni davek</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: "#ea580c" }}>{result.totalWithheld.toFixed(2)} €</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Odbičljiv od slovenskega davka</div>
                  </div>
                  <div style={{ padding: 14, backgroundColor: "#fef9ec", borderRadius: 8, border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 4, textTransform: "uppercase" }}>Slovensko doplačilo (25%)</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: result.totalSlovenianDue > 0 ? "#b45309" : "#16a34a" }}>
                      {result.totalSlovenianDue.toFixed(2)} €
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>= 25% − tuji odtegnjeni</div>
                  </div>
                  <div style={{ padding: 14, backgroundColor: "#f5f5f5", borderRadius: 8, border: "1px solid #ddd" }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 4, textTransform: "uppercase" }}>Plačniki</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: "#333" }}>{result.entryCount}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2" }}>{result.transactionCount} transakcij</div>
                  </div>
                </div>

                {/* Opozorila */}
                {result.hasIncompleteISIN && (
                  <div style={{ padding: 10, backgroundColor: "#fff8e1", borderRadius: 6, border: "1px solid #ffb300", color: "#7c6a0a", fontSize: 12 }}>
                    ⚠ <strong>Manjkajoč ISIN</strong> pri {result.entries.filter(e => !e.isin).map(e => e.asset).join(", ")} — dopolnite pred oddajo.
                  </div>
                )}
                {result.hasIncompleteCountry && (
                  <div style={{ padding: 10, backgroundColor: "#fff8e1", borderRadius: 6, border: "1px solid #ffb300", color: "#7c6a0a", fontSize: 12 }}>
                    ⚠ <strong>Manjkajoča država</strong> pri {result.entries.filter(e => !e.countryCode).map(e => e.asset).join(", ")} — vpišite kodo države (npr. US, IE, DE).
                  </div>
                )}
                {!result.profileComplete && (
                  <div style={{ padding: 10, backgroundColor: "#ffe6e6", borderRadius: 6, border: "1px solid #f57c7c", color: "#c62828", fontSize: 12 }}>
                    ❌ <strong>Profil ni popoln</strong> — davčna številka in ime sta obvezna za oddajo. <a href="/profile" style={{ color: "#c62828" }}>Pojdi na Profil →</a>
                  </div>
                )}

                {/* Tabela dividend po plačniku */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f0fdf4", borderBottom: "2px solid #86efac" }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Asset / Plačnik</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>ISIN</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Država</th>
                        <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>Bruto</th>
                        <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>Tuji davek</th>
                        <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>Doplačilo SI</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Transakcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.entries.map((entry) => (
                        <tr key={entry.asset} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                            <div>{entry.asset}</div>
                            {entry.payerName !== entry.asset && (
                              <div style={{ fontSize: 11, color: "#888" }}>{entry.payerName}</div>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {entry.isin
                              ? <span style={{ fontFamily: "monospace", fontSize: 12 }}>{entry.isin}</span>
                              : <span style={{ color: "#f57f17", fontSize: 11 }}>⚠ manjka</span>}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {entry.countryCode
                              ? <span style={{ fontFamily: "monospace", fontSize: 12 }}>{entry.countryCode}</span>
                              : <span style={{ color: "#f57f17", fontSize: 11 }}>⚠ manjka</span>}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#16a34a", fontWeight: 500 }}>
                            {entry.dividendAmount.toFixed(2)} €
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#ea580c" }}>
                            {entry.withheldTax > 0 ? `${entry.withheldTax.toFixed(2)} €` : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600,
                            color: entry.slovenianTaxDue > 0 ? "#b45309" : "#16a34a" }}>
                            {entry.slovenianTaxDue > 0 ? `${entry.slovenianTaxDue.toFixed(2)} €` : "✔ 0 €"}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", color: "#666" }}>
                            {entry.transactionCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: "2px solid #ddd", backgroundColor: "#fafafa" }}>
                        <td colSpan={3} style={{ padding: "10px 12px", fontWeight: 600 }}>Skupaj</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#16a34a" }}>{result.totalDividends.toFixed(2)} €</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#ea580c" }}>{result.totalWithheld.toFixed(2)} €</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: result.totalSlovenianDue > 0 ? "#b45309" : "#16a34a" }}>{result.totalSlovenianDue.toFixed(2)} €</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#666" }}>{result.transactionCount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {canDownload && (
                  <button
                    onClick={handleDownload}
                    style={{ padding: "12px 18px", borderRadius: 6, border: "none", backgroundColor: "#0369a1", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                  >
                    ⬇ Prenesi XML (DOH-DIV)
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
