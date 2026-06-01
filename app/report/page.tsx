"use client";

import React, { useState } from "react";

type PreviewSale = {
  date: string;
  asset: string;
  amountSold: number;
  revenue: number;
  cost: number;
  profit: number;
  taxAmount: number;
  acquisitionsCount: number;
  saleRowsEstimate: number;
};

type PreviewResponse = {
  year: number;
  salesCount: number;
  totalProfit: number;
  totalLoss: number;
  totalTax: number;
  sales: PreviewSale[];
};

export default function Page(): React.JSX.Element {
  const [userId, setUserId] = useState<string>("");
  const [targetYear, setTargetYear] = useState<number>(2024);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  async function handlePreview() {
    setError(null);
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/preview-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetYear }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || res.statusText || "Preview failed");
      }
      const data = (await res.json()) as PreviewResponse;
      setPreview(data);
    } catch (e: any) {
      setError(e?.message ?? "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch("/api/generate-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetYear }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || res.statusText || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `furs-report-${targetYear}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">FURS Report</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          className="col-span-1 md:col-span-2 border rounded px-3 py-2"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          type="text"
        />

        <input
          className="border rounded px-3 py-2"
          value={targetYear}
          onChange={(e) => setTargetYear(Number(e.target.value))}
          type="number"
          placeholder="Year"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          onClick={handlePreview}
          disabled={loading || !userId}
        >
          {loading ? "Loading…" : "Preview report"}
        </button>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
          onClick={handleDownload}
          disabled={downloading || !userId}
        >
          {downloading ? "Downloading…" : "Download XML"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="p-4 border rounded bg-gray-50">
            <div className="flex gap-6">
              <div>
                <div className="text-sm text-gray-500">Year</div>
                <div className="font-medium">{preview.year}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Sales</div>
                <div className="font-medium">{preview.salesCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Profit</div>
                <div className="font-medium">{preview.totalProfit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Loss</div>
                <div className="font-medium">{preview.totalLoss.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Tax</div>
                <div className="font-medium">{preview.totalTax.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Asset</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Revenue</th>
                  <th className="p-2">Cost</th>
                  <th className="p-2">Profit</th>
                  <th className="p-2">Tax</th>
                  <th className="p-2">Acquisitions</th>
                  <th className="p-2">Rows est.</th>
                </tr>
              </thead>
              <tbody>
                {preview.sales.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 align-top">{new Date(s.date).toISOString().slice(0, 10)}</td>
                    <td className="p-2 align-top">{s.asset}</td>
                    <td className="p-2 align-top">{s.amountSold.toFixed(2)}</td>
                    <td className="p-2 align-top">{s.revenue.toFixed(2)}</td>
                    <td className="p-2 align-top">{s.cost.toFixed(2)}</td>
                    <td className="p-2 align-top">{s.profit.toFixed(2)}</td>
                    <td className="p-2 align-top">{s.taxAmount.toFixed(2)}</td>
                    <td className="p-2 align-top">{s.acquisitionsCount}</td>
                    <td className="p-2 align-top">{s.saleRowsEstimate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
