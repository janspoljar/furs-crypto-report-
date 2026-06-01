"use client";

import { useState } from "react";

export default function UploadPage() {
  const [broker, setBroker] = useState("trading212");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [result, setResult] = useState<string>("");

  async function handleUpload() {
  if (!selectedFile) {
    setErrorMessage("Izberi datoteko pred nalaganjem.");
    return;
  }

  setLoading(true);
  setSuccessMessage("");
  setErrorMessage("");
  setResult("");

  try {
    const formData = new FormData();
    formData.append("broker", broker);
    formData.append("file", selectedFile);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || res.statusText || "Upload failed");
    }

    setSuccessMessage("Upload je bil uspešen.");
    setResult(JSON.stringify(data, null, 2));
  } catch (error: any) {
    setErrorMessage(error?.message ?? "Napaka pri nalaganju.");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Upload broker CSV</h1>
      <p className="mt-4 text-slate-600">
        Naloži CSV datoteko in pripravi transakcije za FIFO obdelavo.
      </p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Broker
        </label>
        <select
          className="rounded border px-3 py-2 w-full"
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
        >
          <option value="trading212">Trading212</option>
          <option value="trade-republic">Trade Republic</option>
          <option value="revolut">Revolut</option>
          <option value="etoro">eToro</option>
        </select>
        <p className="mt-2 text-sm text-slate-500">
          Recommended: Trading212 and Trade Republic
        </p>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          CSV datoteka
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setSelectedFile(file ?? null);
          }}
          className="w-full"
        />
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          onClick={handleUpload}
          disabled={loading || !selectedFile}
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>

      {selectedFile && (
        <div className="mt-3 text-sm text-slate-600">
          Izbrana datoteka: {selectedFile.name}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-green-800">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800">
          {errorMessage}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Rezultat</h2>
        <pre className="overflow-x-auto rounded bg-slate-100 p-4 text-sm whitespace-pre-wrap">
          {result || "Še ni rezultata."}
        </pre>
      </div>
    </main>
  );
}