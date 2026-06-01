"use client";

import { useState } from "react";

interface ValidationResult {
  success: boolean;
  year: number | null;
  reportYear: number | null;
  sellCount: number;
  netRealized: number;
  hasMissingISIN: boolean;
  hasUnmatchedQty: boolean;
  profileComplete: boolean;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface Props {
  availableYears: number[];
}

export default function DohKdvpExportForm({ availableYears }: Props) {
  const [selectedYear, setSelectedYear] = useState(availableYears[0]?.toString() ?? "");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatorWarning, setValidatorWarning] = useState<string | null>(null);

  async function handleValidate() {
    setLoading(true);
    setError(null);
    setValidatorWarning(null);

    const params = new URLSearchParams();
    if (selectedYear) params.set("year", selectedYear);
    params.set("validate", "1");

    try {
      const response = await fetch(`/api/reports/doh-kdvp/xml?${params}`);
      const contentType = response.headers.get("content-type") || "";
      const bodyText = await response.text();

      let data: unknown;
      const isJsonResponse = contentType.includes("application/json") || bodyText.trimStart().startsWith("{");

      if (isJsonResponse) {
        try {
          data = JSON.parse(bodyText);
        } catch (parseErr) {
          console.error("Failed to parse JSON response:", parseErr, { status: response.status, contentType, bodyText });
          setError(`Server returned invalid JSON (status ${response.status}, content-type ${contentType}). Raw response: ${bodyText.slice(0, 2000)}`);
          setValidationResult(null);
          return;
        }
      } else {
        console.error("Validate response was not JSON", { status: response.status, contentType, bodyText });
        setError(`Server returned non-JSON response (status ${response.status}, content-type ${contentType}). Raw response: ${bodyText.slice(0, 2000)}`);
        setValidationResult(null);
        return;
      }

      if (!response.ok) {
        const parsed = data as { error?: string; details?: unknown; failedAt?: string };
        const detailsText = parsed?.details
          ? typeof parsed.details === "string"
            ? parsed.details
            : JSON.stringify(parsed.details)
          : undefined;
        if (parsed?.failedAt === "validator-availability") {
          setValidatorWarning(
            "Lokalna XML schema validacija trenutno ni na voljo. XML export je še vedno mogoč, vendar ni preverjen z lokalnim validatorjem."
          );
          setError(null);
          setValidationResult(null);
          return;
        }

        setError(
          `${parsed?.error ?? `Validacija ni uspela. Status ${response.status}`}${detailsText ? ` — ${detailsText}` : ""}`
        );
        setValidationResult(null);
        return;
      }

      setValidationResult(data as ValidationResult);
      if ((data as ValidationResult).validation.errors.length > 0) {
        setError(null);
      }
    } catch (err: any) {
      console.error("Validate request error:", err);
      setError(err?.message ?? "Napaka pri validaciji.");
      setValidationResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    const params = new URLSearchParams();
    if (selectedYear) params.set("year", selectedYear);

    try {
      const response = await fetch(`/api/reports/doh-kdvp/xml?${params}`);
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        // Try to parse error as JSON
        let errorMsg = "Prenos je bil neuspešen.";
        try {
          const data = await response.json();
          errorMsg = data?.error ?? errorMsg;
        } catch {
          errorMsg = `Server error ${response.status}`;
        }
        setError(errorMsg);
        return;
      }

      // Check if response is actually XML
      if (!contentType.includes("application/xml")) {
        console.warn("Expected XML, got:", contentType);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Doh_KDVP_${selectedYear || "all"}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Download error:", err);
      setError(err?.message ?? "Napaka pri prenosu.");
    }
  }

  const canValidate = selectedYear || availableYears.length > 0;
  const canDownload = (validationResult?.success && validationResult?.validation.errors.length === 0) || !!validatorWarning;

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: "#333" }}>
        Doh-KDVP XML Export
      </h2>

      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 500, color: "#333" }}>Izberi leto za export</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={loading}
              style={{
                padding: 12,
                borderRadius: 6,
                border: "1px solid #ccc",
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <option value="">Izberi leto...</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={handleValidate}
          disabled={!canValidate || loading}
          style={{
            padding: "12px 18px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontWeight: 600,
            cursor: !canValidate || loading ? "not-allowed" : "pointer",
            opacity: !canValidate || loading ? 0.5 : 1,
          }}
        >
          {loading ? "Preverjam..." : "Preveri validacijo"}
        </button>

        <div
          style={{
            padding: 10,
            backgroundColor: "#f8fafc",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            color: "#475569",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Local validator may be unavailable on some Windows environments. XML export still works, but local schema validation may not run.
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              backgroundColor: "#ffe6e6",
              borderRadius: 6,
              border: "1px solid #f57c7c",
              color: "#c62828",
              fontSize: 13,
            }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>Napaka pri validaciji</strong>
            {error}
          </div>
        )}

        {validatorWarning && (
          <div
            style={{
              padding: 12,
              backgroundColor: "#fff8e1",
              borderRadius: 6,
              border: "1px solid #ffb300",
              color: "#7c6a0a",
              fontSize: 13,
            }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>
              Lokalni XML validator ni na voljo
            </strong>
            {validatorWarning}
          </div>
        )}

        <div
          style={{
            padding: 12,
            backgroundColor: "#eef2ff",
            borderRadius: 6,
            border: "1px solid #c7d2fe",
            color: "#3730a3",
            fontSize: 13,
          }}
        >
          Lokalni validator je lahko nedosegljiv v nekaterih Windows okoljih. XML export še vedno deluje, vendar v tem primeru ne bo izvedena lokalna schema validacija.
        </div>

        {validationResult && (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                padding: 12,
                backgroundColor: validationResult.success ? "#f0f9ff" : "#ffe6e6",
                borderRadius: 6,
                border: `1px solid ${validationResult.success ? "#90caf9" : "#f57c7c"}`,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {validationResult.success ? "✓ Validacija uspešna" : "✗ Validacija neuspešna"}
              </div>

              {validationResult.validation.errors.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#c62828", marginBottom: 6 }}>
                    Napake:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                    {validationResult.validation.errors.map((err, i) => (
                      <li key={i} style={{ color: "#c62828", marginBottom: 4 }}>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.validation.warnings.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#f57f17", marginBottom: 6 }}>
                    Svarila:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                    {validationResult.validation.warnings.map((warn, i) => (
                      <li key={i} style={{ color: "#f57f17", marginBottom: 4 }}>
                        {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {validationResult.success && (
              <div
                style={{
                  padding: 16,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 12, color: "#333" }}>
                  Preview izvoza
                </div>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Leto:</span>
                    <strong>{validationResult.reportYear || "Vse"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Število prodaj:</span>
                    <strong>{validationResult.sellCount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Neto realizirani rezultat:</span>
                    <strong
                      style={{
                        color: validationResult.netRealized >= 0 ? "#2a7" : "#c62828",
                      }}
                    >
                      {validationResult.netRealized.toFixed(2)} €
                    </strong>
                  </div>
                  {validationResult.hasMissingISIN && (
                    <div style={{ color: "#f57f17", marginTop: 8, fontSize: 12 }}>
                      ⚠ Nekateri vrednostni papirji nimajo ISIN podatkov.
                    </div>
                  )}
                  {validationResult.hasUnmatchedQty && (
                    <div style={{ color: "#f57f17", marginTop: 2, fontSize: 12 }}>
                      ⚠ Obstajajo neujetoprodaje brez popolnega FIFO ujemanja.
                    </div>
                  )}
                </div>
              </div>
            )}

            {canDownload && (
              <button
                onClick={handleDownload}
                style={{
                  padding: "12px 18px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#2a7",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ⬇ Prenesi XML
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
