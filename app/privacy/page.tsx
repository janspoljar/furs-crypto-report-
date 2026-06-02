import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://davkinadelnicah.si";

export const metadata: Metadata = {
  title: "Politika zasebnosti | DavkiNaDelnicah.si",
  description: "Informacije o obdelavi osebnih podatkov na DavkiNaDelnicah.si v skladu z GDPR.",
  alternates: { canonical: `${APP_URL}/privacy` },
  openGraph: {
    title: "Politika zasebnosti | DavkiNaDelnicah.si",
    description: "Informacije o obdelavi osebnih podatkov na DavkiNaDelnicah.si v skladu z GDPR.",
    url: `${APP_URL}/privacy`,
    siteName: "DavkiNaDelnicah.si",
    type: "website",
    locale: "sl_SI",
  },
};

// ⚠️ ZAMENJAJ vse vrednosti označene z [ZAMENJAJ] z resničnimi podatki pred objavo.

const LAST_UPDATED = "1. junij 2026";
const CONTROLLER_NAME = "⚠️ [ZAMENJAJ: Ime podjetja ali S.P., npr. Jan Spoljar s.p.]";
const CONTROLLER_ADDRESS = "⚠️ [ZAMENJAJ: Ulica in hišna številka, Poštna številka Kraj]";
const CONTROLLER_EMAIL = "podpora@davkinadelnicah.si";
const CONTROLLER_TAX_ID = "⚠️ [ZAMENJAJ: SI12345678 ali 'ni zavezanec']";

export default function PrivacyPage() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap" style={{ maxWidth: 800 }}>
          <h1>Politika zasebnosti</h1>
          <p>Zadnja posodobitev: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="wrap" style={{ maxWidth: 800, paddingBottom: 80 }}>
        <div className="prose">

          <h2>1. Upravljavec osebnih podatkov</h2>
          <p>
            Upravljavec osebnih podatkov, zbranih prek spletne storitve DavkiNaDelnicah.si, je:
          </p>
          <p style={{ paddingLeft: 20, borderLeft: "3px solid var(--line)", color: "var(--ink-soft)" }}>
            <strong>{CONTROLLER_NAME}</strong><br />
            {CONTROLLER_ADDRESS}, Slovenija<br />
            ID za DDV: {CONTROLLER_TAX_ID}<br />
            E-pošta: <a href={`mailto:${CONTROLLER_EMAIL}`}>{CONTROLLER_EMAIL}</a>
          </p>

          <h2>2. Katere osebne podatke zbiramo</h2>
          <p>Zbiramo naslednje kategorije osebnih podatkov:</p>
          <ul>
            <li>
              <strong>Podatki za prijavo:</strong> e-poštni naslov, čas registracije, zadnja prijava.
              Zbrani ob ustvaritvi računa prek Supabase Auth.
            </li>
            <li>
              <strong>Transakcijski podatki:</strong> podatki, ki jih naložite iz CSV izpiskov vaših
              posrednikov (datum, vrsta transakcije, naložbeni instrument, znesek v EUR, provizija).
              Ti podatki <strong>ne vsebujejo celotnih CSV datotek</strong> — hranimo le strukturirane
              povzetke, potrebne za izračun.
            </li>
            <li>
              <strong>Davčni profil:</strong> davčna številka, ime in priimek, naslov — vneseni
              prostovoljno za generiranje XML obrazca za eDavki.
            </li>
            <li>
              <strong>Plačilni podatki:</strong> podatki o plačilu (plan, datum plačila, veljavnost
              naročnine). Številke kartic <strong>ne shranjujemo</strong> — plačila obdeluje Stripe.
            </li>
            <li>
              <strong>Tehnični podatki:</strong> IP naslov, vrsta brskalnika, dnevniški zapisi
              dostopov. Zbrani avtomatsko za zagotavljanje varnosti in odpravljanje napak.
            </li>
          </ul>

          <h2>3. Namen in pravna podlaga obdelave</h2>
          <table className="data" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Namen</th>
                <th>Pravna podlaga (GDPR čl. 6)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Zagotavljanje storitve — izračun davčne napovedi</td>
                <td>Čl. 6(1)(b) — izpolnitev pogodbe</td>
              </tr>
              <tr>
                <td>Obdelava plačila (Stripe)</td>
                <td>Čl. 6(1)(b) — izpolnitev pogodbe</td>
              </tr>
              <tr>
                <td>Avtentikacija in varnost računa</td>
                <td>Čl. 6(1)(b) — izpolnitev pogodbe</td>
              </tr>
              <tr>
                <td>Hramba transakcijskih podatkov za davčne namene</td>
                <td>Čl. 6(1)(c) — zakonska obveznost (ZDavP-2)</td>
              </tr>
              <tr>
                <td>Pošiljanje transakcijskih e-pošt (potrditev, opomnila)</td>
                <td>Čl. 6(1)(b) — izpolnitev pogodbe</td>
              </tr>
              <tr>
                <td>Analitika in izboljšanje storitve</td>
                <td>Čl. 6(1)(f) — zakoniti interes</td>
              </tr>
            </tbody>
          </table>

          <h2>4. Rok hrambe podatkov</h2>
          <ul>
            <li>
              <strong>Transakcijski podatki:</strong> 10 let od davčnega leta, na katerega se
              nanašajo — v skladu z ZDavP-2 (čl. 86) in ZDDV-1.
            </li>
            <li>
              <strong>Podatki o računu (e-pošta, davčni profil):</strong> do izbrisa računa.
              Po izbrisu se podatki trajno anonimizirajo v 30 dneh.
            </li>
            <li>
              <strong>Plačilni zapisi:</strong> 10 let v skladu z ZGD-1 (zahteve računovodske
              hrambe) — hranimo le metapodatke transakcije, ne podatkov kartice.
            </li>
            <li>
              <strong>Dnevniški zapisi (IP, dostopi):</strong> 90 dni.
            </li>
          </ul>

          <h2>5. Prenos podatkov tretjim osebam</h2>
          <p>
            Vaši podatki se ne prodajajo in se ne posredujejo tretjim osebam za oglaševanje.
            Za delovanje storitve uporabljamo naslednje obdelovalce:
          </p>
          <ul>
            <li>
              <strong>Supabase Inc.</strong> (baza podatkov in avtentikacija) — podatki shranjeni
              v EU regiji (Frankfurt, eu-west-1). Sklenjena DPA v skladu z GDPR.
            </li>
            <li>
              <strong>Stripe Inc.</strong> (plačilna obdelava) — obdeluje plačilne podatke v EU.
              Stripe je certificiran PCI DSS Level 1. Sklenjena DPA.
            </li>
            <li>
              <strong>Vercel Inc.</strong> (gostovanje aplikacije) — strežniki v EU regiji.
              Sklenjena DPA v skladu z GDPR.
            </li>
          </ul>
          <p>
            V primeru prenosa podatkov izven EU (npr. pri varnostnih kopiranjih) zagotavljamo
            ustrezne zaščitne ukrepe v skladu s Standardnimi pogodbenimi klavzulami EU (SCC).
          </p>

          <h2>6. Vaše pravice</h2>
          <p>V skladu z GDPR imate naslednje pravice:</p>
          <ul>
            <li><strong>Pravica do dostopa (čl. 15):</strong> zahtevate kopijo vaših osebnih podatkov.</li>
            <li><strong>Pravica do popravka (čl. 16):</strong> zahtevate popravek netočnih podatkov.</li>
            <li><strong>Pravica do izbrisa (čl. 17):</strong> zahtevate izbris podatkov, razen kadar nas k hranjenju zavezuje zakon.</li>
            <li><strong>Pravica do omejitve obdelave (čl. 18):</strong> zahtevate začasno prekinitev obdelave.</li>
            <li><strong>Pravica do prenosljivosti (čl. 20):</strong> prejmete svoje podatke v strojno berljivi obliki (JSON/CSV).</li>
            <li><strong>Pravica do ugovora (čl. 21):</strong> ugovarjate obdelavi na podlagi zakonitega interesa.</li>
          </ul>
          <p>
            Pravice uveljavljate s pisno zahtevo na{" "}
            <a href={`mailto:${CONTROLLER_EMAIL}`}>{CONTROLLER_EMAIL}</a>.
            Odgovorimo v 30 dneh. Pritožbo lahko vložite pri Informacijskem pooblaščencu RS
            ({" "}<a href="https://www.ip-rs.si" target="_blank" rel="noopener noreferrer">www.ip-rs.si</a>).
          </p>

          <h2>7. Varnost podatkov</h2>
          <p>
            Varujemo vaše podatke z naslednjimi ukrepi:
          </p>
          <ul>
            <li>Vse povezave so šifrirane s TLS 1.3.</li>
            <li>Dostop do baze podatkov je zaščiten z Row Level Security (RLS) — vsak uporabnik vidi izključno lastne podatke.</li>
            <li>CSV datoteke se ne shranjujejo na strežniku — obdelajo se v brskalnikovem pomnilniku.</li>
            <li>Gesla niso shranjena — avtentikacija poteka prek varnih tokenov (Supabase Auth / JWT).</li>
            <li>Privilegirani dostop (service role) je omejen na backend in ni dostopen v brskalniku.</li>
          </ul>

          <h2>8. Piškotki</h2>
          <p>
            Storitev uporablja naslednje piškotke:
          </p>
          <ul>
            <li>
              <strong>Avtentikacijski piškotek</strong> (Supabase session token) — nujno potreben za
              delovanje storitve. Ni možno zavrniti za prijavljene uporabnike.
            </li>
            <li>
              <strong>Nastavitve teme</strong> (localStorage: <code>dnd-theme</code>) — tehnično
              nujni, ne vsebujejo osebnih podatkov.
            </li>
          </ul>
          <p>
            Storitev trenutno <strong>ne uporablja</strong> analitičnih ali oglaševalskih piškotkov
            tretjih oseb.
          </p>

          <h2>9. Spremembe politike zasebnosti</h2>
          <p>
            O bistvenih spremembah vas obvestimo po e-pošti ali z obvestilom ob prijavi vsaj
            14 dni pred uveljavitvijo. Datum zadnje posodobitve je naveden na vrhu strani.
          </p>

          <h2>10. Kontakt</h2>
          <p>
            Za vsa vprašanja v zvezi z obdelavo osebnih podatkov nas kontaktirajte:
          </p>
          <p style={{ paddingLeft: 20, borderLeft: "3px solid var(--line)", color: "var(--ink-soft)" }}>
            <strong>{CONTROLLER_NAME}</strong><br />
            {CONTROLLER_ADDRESS}<br />
            E-pošta: <a href={`mailto:${CONTROLLER_EMAIL}`}>{CONTROLLER_EMAIL}</a>
          </p>
        </div>
      </section>
    </main>
  );
}
