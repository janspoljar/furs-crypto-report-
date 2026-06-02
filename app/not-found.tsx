import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stran ni najdena | DavkiNaDelnicah.si",
};

export default function NotFound() {
  return (
    <main>
      <section className="notfound-section">
        <div>
          <div className="code">404</div>
          <h1>Stran ni bila najdena</h1>
          <p>Stran, ki jo iščete, ne obstaja ali je bila premaknjena.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/" className="btn btn-primary">Nazaj na domačo <span className="arr">→</span></a>
            <a href="/upload" className="btn btn-ghost">Uvozi izpisek</a>
          </div>
        </div>
      </section>
    </main>
  );
}
