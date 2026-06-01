"use client";

import { useMemo, useState } from "react";
import type { TaxpayerProfile } from "@/lib/types";

interface Props {
  initialData: TaxpayerProfile | null;
}

interface FieldErrors {
  taxNumber?: string;
  fullName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export default function TaxpayerProfileForm({ initialData }: Props) {
  const [taxNumber, setTaxNumber] = useState(initialData?.taxNumber ?? "");
  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [city, setCity] = useState(initialData?.city ?? "");
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? "");
  const [country, setCountry] = useState(initialData?.country ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const profile = useMemo(
    () => ({ taxNumber, fullName, address, city, postalCode, country }),
    [taxNumber, fullName, address, city, postalCode, country]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerMessage(null);
    const fieldErrors: FieldErrors = {};

    if (!taxNumber.trim()) {
      fieldErrors.taxNumber = "Davčna številka je obvezno polje.";
    } else if (!/^[0-9]{8}$/.test(taxNumber.trim())) {
      fieldErrors.taxNumber = "Davčna številka mora imeti 8 števk.";
    }

    if (!fullName.trim()) {
      fieldErrors.fullName = "Ime in priimek sta obvezna.";
    }

    if (!address.trim()) {
      fieldErrors.address = "Naslov je obvezen.";
    }

    if (!city.trim()) {
      fieldErrors.city = "Kraj je obvezen.";
    }

    if (!postalCode.trim()) {
      fieldErrors.postalCode = "Poštna številka je obvezna.";
    }

    if (!country.trim()) {
      fieldErrors.country = "Država je obvezna.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setStatus("failed");
      return;
    }

    setErrors({});
    setStatus("saving");

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    const result = await response.json();

    if (!response.ok) {
      setStatus("failed");
      setServerMessage(result?.error ?? "Napaka pri shranjevanju.");
      if (result?.errors) {
        const nextErrors: FieldErrors = {};
        result.errors.forEach((message: string) => {
          if (message.toLowerCase().includes("davčna") || message.toLowerCase().includes("tax")) {
            nextErrors.taxNumber = message;
          }
          if (message.toLowerCase().includes("postal")) {
            nextErrors.postalCode = message;
          }
          if (message.toLowerCase().includes("country")) {
            nextErrors.country = message;
          }
        });
        setErrors(nextErrors);
      }
      return;
    }

    setStatus("saved");
    setServerMessage("Podatki so bili uspešno shranjeni.");
  }

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <p style={{ marginBottom: 16, color: "#444" }}>
        Ti podatki se uporabljajo za Doh-KDVP XML export. Brez njih export ne bo popoln.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Davčna številka
            <input
              type="text"
              value={taxNumber}
              onChange={(event) => setTaxNumber(event.target.value)}
              placeholder="npr. 12345678"
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>
          {errors.taxNumber && <div style={{ color: "#b22" }}>{errors.taxNumber}</div>}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Ime in priimek
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Polno ime"
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>
          {errors.fullName && <div style={{ color: "#b22" }}>{errors.fullName}</div>}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Naslov
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Ulica in hišna številka"
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>
          {errors.address && <div style={{ color: "#b22" }}>{errors.address}</div>}
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
          <label>
            Poštna številka
            <input
              type="text"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="Pošta"
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>
          <label>
            Kraj
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Mesto"
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {errors.postalCode && <div style={{ color: "#b22" }}>{errors.postalCode}</div>}
          {errors.city && <div style={{ color: "#b22" }}>{errors.city}</div>}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Država
            <input
              type="text"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Slovenija"
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>
          {errors.country && <div style={{ color: "#b22" }}>{errors.country}</div>}
        </div>

        <button
          type="submit"
          disabled={status === "saving"}
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            border: "none",
            background: status === "saved" ? "#2a7" : "#2563eb",
            color: "white",
            cursor: status === "saving" ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {status === "saving" ? "Shranjujem..." : "Shrani podatke"}
        </button>

        {serverMessage && (
          <div style={{ color: status === "saved" ? "#176f2c" : "#b22" }}>{serverMessage}</div>
        )}
      </form>
    </section>
  );
}
