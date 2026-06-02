import type { Metadata } from "next";
import { APP_URL, buildMetadata, buildWebSiteJsonLd, buildOrganizationJsonLd } from "@/lib/seo";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "podpora@davkinadelnicah.si";

export const metadata: Metadata = buildMetadata({
  title: "FURS XML za delnice, ETF-je in dividende | DavkiNaDelnicah.si",
  description:
    "Uvozite CSV iz Trading 212, Revolut ali IBKR, izračunajte FIFO kapitalski dobiček in generirajte XML za eDavki (DOH-KDVP, DOH-DIV). Za slovenske vlagatelje.",
  shortDescription:
    "Uvozite CSV iz Trading 212, Revolut ali IBKR. Avtomatski FIFO izračun. DOH-KDVP in DOH-DIV XML za eDavki v minutah.",
  ogImageAlt: "DavkiNaDelnicah.si — Davčna napoved brez glavobola",
});

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2.4" strokeLinecap="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted-2)" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const BROKERS = [
  { bg: "#000", fg: "#fff", l: "T", name: "Trading 212" },
  { bg: "#0075EB", fg: "#fff", l: "R", name: "Revolut" },
  { bg: "#D81222", fg: "#fff", l: "I", name: "Interactive Brokers" },
  { bg: "#F2A900", fg: "#000", l: "B", name: "Binance" },
  { bg: "#0052FF", fg: "#fff", l: "C", name: "Coinbase" },
  { bg: "#FF5C46", fg: "#fff", l: "e", name: "eToro" },
  { bg: "#5563C1", fg: "#fff", l: "K", name: "Kraken" },
];

const PREVIEW_TXS = [
  { type: "prodaja", tick: "NVDA", detail: "12. okt 2024 · Trading 212", amt: "+812,40 €", pos: true },
  { type: "prodaja", tick: "ASML", detail: "8. okt 2024 · Interactive Brokers", amt: "+1.214,90 €", pos: true },
  { type: "nakup", tick: "VWCE", detail: "2. sep 2024 · Revolut", amt: "−1.000,00 €", pos: false },
  { type: "prodaja", tick: "AAPL", detail: "15. avg 2024 · Trading 212", amt: "+342,55 €", pos: true },
  { type: "dividenda", tick: "VUSA", detail: "3. jul 2024 · Trading 212", amt: "+18,22 €", pos: true },
];

const FAQS = [
  { q: "Ali so moji podatki varni?", a: "Tvoji izpiski se obdelajo izključno v tvojem brskalniku — ne shranjujemo CSV datotek. V bazi hranimo le anonimizirane povzetke transakcij, ki so potrebni za izračun in zgodovino poročil. Vse povezave so šifrirane (TLS 1.3)." },
  { q: "Katere posrednike podpirate?", a: "Trading 212, Revolut, Interactive Brokers, eToro, Binance, Coinbase, Kraken in Bitstamp. Če uporabljaš drugega posrednika, nam pošlji vzorčni CSV — običajno ga dodamo v dnevih." },
  { q: "Kako vem, da je izračun pravilen?", a: "V poročilu vidiš vsako prodajo posebej s parjenjem na izvirni nakup (FIFO), uporabljenim referenčnim tečajem ECB in odštetimi provizijami. Vse postavke so transparentne in jih lahko sam preveriš." },
  { q: "Ali nadomeščate davčnega svetovalca?", a: "Ne. Davko avtomatizira izračun in pripravo uradne datoteke, ne nadomesti pa profesionalnega davčnega svetovanja. Pri kompleksnih primerih priporočamo posvet s strokovnjakom." },
  { q: "Kako odpovem Pro naročnino?", a: "Pro naročnina velja eno leto. Po izteku ne obnovimo plačila samodejno — sam odločiš, ali jo naslednje leto podaljšaš. Že ustvarjena poročila ostanejo dostopna." },
];

const JSON_LD_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DavkiNaDelnicah.si",
  url: APP_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Orodje za slovenske vlagatelje: uvoz CSV iz Trading 212, Revolut in IBKR, avtomatski FIFO izračun kapitalskega dobička in generiranje XML za eDavki (DOH-KDVP, DOH-DIV).",
  offers: {
    "@type": "Offer",
    price: "19",
    priceCurrency: "EUR",
    description: "Pro načrt — eno davčno leto, brez samodejne obnove",
  },
  inLanguage: "sl",
  audience: {
    "@type": "Audience",
    geographicArea: { "@type": "Country", name: "Slovenia" },
  },
};

const JSON_LD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  const orgJsonLd = buildOrganizationJsonLd();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_APP) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd()) }} />
      {orgJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />}

      {/* HERO */}
      <section className="hero-mkt">
        <div className="wrap">
          <div className="copy">
            <span className="eyebrow reveal">Za slovenske vlagatelje · po pravilih FURS</span>
            <h1 className="h-display reveal d1">
              Davčna napoved <em>brez glavobola</em>.
            </h1>
            <p className="lede reveal d2">
              Naloži izpisek transakcij od svojega borznega posrednika. Davko izračuna kapitalski
              dobiček po metodi FIFO in pripravi <strong>uradni XML</strong> za neposreden uvoz v
              eDavki — Doh-KDVP in Doh-Div.
            </p>
            <div className="actions reveal d2">
              <a href="/upload" className="btn btn-primary btn-lg">
                Začni brezplačno <span className="arr">→</span>
              </a>
              <a href="#funkcije" className="btn btn-ghost btn-lg">Poglej kako deluje</a>
            </div>
            <div className="meta reveal d3">
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg> Pripravljeno za eDavki</span>
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg> Podpora 8+ posrednikov</span>
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg> Brezplačen račun v 30 sekundah</span>
            </div>
          </div>

          <div className="hero-visual reveal d3">
            <div className="browser-bar">
              <span className="d"/><span className="d"/><span className="d"/>
              <span className="url">davkinadelnicah.si/reports</span>
            </div>
            <div className="preview-grid">
              <div className="col gap-3">
                <div className="stat">
                  <div className="k">Skupni kapitalski dobiček 2024</div>
                  <div className="v pos">+4.832,17 €</div>
                  <div className="sub">147 transakcij · 4 borze</div>
                </div>
                <div className="stat">
                  <div className="k">Ocenjeni davek</div>
                  <div className="v">1.208,04 €</div>
                  <div className="sub">Po stopnji 25 % · do 5 let imetja</div>
                </div>
                <a href="/reports" className="btn btn-primary" style={{alignSelf:"flex-start"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M12 15l-4-4M12 15l4-4"/><path d="M5 21h14"/></svg>
                  Prenesi Doh-KDVP.xml
                </a>
              </div>
              <div className="stack">
                {PREVIEW_TXS.map((tx, i) => (
                  <div className="tx-row" key={i}>
                    <span className={tx.type === "nakup" ? "tag-buy" : tx.type === "dividenda" ? "tag-div" : "tag-sell"}>{tx.type}</span>
                    <div><div className="tick">{tx.tick}</div><div className="mid">{tx.detail}</div></div>
                    <span className={`amt ${tx.pos ? "text-pos" : "mono"}`}>{tx.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BROKERS */}
      <section className="brokers-strip">
        <div className="wrap">
          <p className="lab reveal">Podprti posredniki</p>
          <div className="brokers-row reveal d1">
            {BROKERS.map((b) => (
              <span className="b" key={b.name}>
                <span className="logo-dot" style={{background:b.bg, color:b.fg}}>{b.l}</span>
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="funkcije">
        <div className="wrap">
          <div className="reveal" style={{maxWidth:"38em", marginBottom:48}}>
            <span className="eyebrow">Funkcije</span>
            <h2 className="h-1" style={{marginTop:18}}>Vse, kar potrebuješ za napoved — nič več, nič manj.</h2>
          </div>
          <div className="feat-grid">
            <article className="feat feat-1 reveal">
              <span className="badge badge-info">FIFO izračun</span>
              <h3>Pošten in pravilen izračun kapitalskega dobička.</h3>
              <p>Davko sparuje vsako prodajo z najstarejšim ujemajočim nakupom. Tečaji se samodejno pretvorijo v EUR po referenčnem tečaju ECB na datum posla — natanko tako, kot zahteva FURS.</p>
              <div className="v">
                <div className="row"><span>NVDA · 8 kosov · prodaja 12.10.2024</span><span className="v-pos">+812,40 €</span></div>
                <div className="row"><span>NVDA · 5 kosov · nakup 03.04.2023</span><span className="mono">−420,15 €</span></div>
                <div className="row"><span>NVDA · 3 kosi · nakup 11.07.2023</span><span className="mono">−285,00 €</span></div>
              </div>
            </article>
            <article className="feat reveal d1">
              <span className="badge badge-info">XML izvoz</span>
              <h3>Uradna XML datoteka.</h3>
              <p>Doh-KDVP in Doh-Div datoteki, pripravljeni za neposreden uvoz v eDavki — brez ročnega prepisovanja postavk.</p>
            </article>
            <article className="feat reveal d2">
              <span className="badge badge-info">8+ posrednikov</span>
              <h3>Samodejno prepoznavanje.</h3>
              <p>Naložiš CSV — Davko prepozna borzo, identificira ticker, datum, ceno in provizijo. Ti samo preveriš.</p>
            </article>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — SEO anchor section */}
      <section className="section" id="kako-deluje" style={{paddingTop:0}}>
        <div className="wrap">
          <div className="reveal text-center" style={{maxWidth:"36em", margin:"0 auto 40px"}}>
            <span className="eyebrow" style={{justifyContent:"center"}}>Kako deluje</span>
            <h2 className="h-1" style={{marginTop:18}}>Od CSV do eDavki v treh korakih.</h2>
          </div>
          <div className="feat-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
            <article className="feat reveal" style={{textAlign:"center"}}>
              <div style={{
                width:48,height:48,borderRadius:"50%",background:"var(--accent-tint,rgba(1,105,111,0.1))",
                display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",
                fontSize:20,fontWeight:700,color:"var(--accent)",
              }}>1</div>
              <h3 style={{fontSize:16}}>Uvoz CSV</h3>
              <p style={{fontSize:14}}>
                Povlecite ali naložite CSV datoteko iz Trading 212, Revolut, Interactive Brokers (IBKR), Binance, Coinbase ali Kraken. Posrednik se zazna samodejno.
              </p>
            </article>
            <article className="feat reveal d1" style={{textAlign:"center"}}>
              <div style={{
                width:48,height:48,borderRadius:"50%",background:"var(--accent-tint,rgba(1,105,111,0.1))",
                display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",
                fontSize:20,fontWeight:700,color:"var(--accent)",
              }}>2</div>
              <h3 style={{fontSize:16}}>FIFO izračun</h3>
              <p style={{fontSize:14}}>
                Aplikacija sparuje vsako prodajo delnic ali ETF-jev z najstarejšim ujemajočim nakupom. Vrednosti se pretvorijo v EUR po referenčnih tečajih ECB — natanko po zahtevah FURS.
              </p>
            </article>
            <article className="feat reveal d2" style={{textAlign:"center"}}>
              <div style={{
                width:48,height:48,borderRadius:"50%",background:"var(--accent-tint,rgba(1,105,111,0.1))",
                display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",
                fontSize:20,fontWeight:700,color:"var(--accent)",
              }}>3</div>
              <h3 style={{fontSize:16}}>XML za eDavki</h3>
              <p style={{fontSize:14}}>
                Prenesete DOH-KDVP za kapitalski dobiček in DOH-DIV za dividende ter datoteki neposredno uvozite v portal eDavki.{" "}
                <a href="/navodila" style={{color:"var(--accent)"}}>Navodila za uvoz →</a>
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className="section" style={{paddingTop:0}}>
        <div className="wrap">
          <div className="reveal text-center" style={{maxWidth:"36em", margin:"0 auto 40px"}}>
            <span className="eyebrow" style={{justifyContent:"center"}}>Cenik</span>
            <h2 className="h-1" style={{marginTop:18}}>Brezplačno za izračun. Plačaš samo za izvoz.</h2>
          </div>
          <div className="compare-grid">
            <div className="compare-col reveal">
              <div className="head"><h3>Brezplačno</h3><span className="price">0 €</span></div>
              <p className="muted" style={{fontSize:14}}>Za preverjanje stanja in pregled portfelja.</p>
              <ul>
                <li><CheckIcon/> Do 200 transakcij</li>
                <li><CheckIcon/> Samodejno prepoznavanje posrednika</li>
                <li><CheckIcon/> Pregled dobička in izgube</li>
                <li className="no"><XIcon/> Doh-KDVP XML izvoz</li>
                <li className="no"><XIcon/> Doh-Div poročilo</li>
              </ul>
              <a className="btn btn-line cta" href="/upload">Začni brezplačno</a>
            </div>
            <div className="compare-col pro reveal d1">
              <span className="ribbon">Priporočeno</span>
              <div className="head"><h3>Pro</h3><span className="price">19&nbsp;€<small>/leto</small></span></div>
              <p className="muted" style={{fontSize:14}}>Vse, kar potrebuješ za oddajo napovedi.</p>
              <ul>
                <li><CheckIcon/> Neomejeno transakcij</li>
                <li><CheckIcon/> Doh-KDVP XML za neposreden uvoz</li>
                <li><CheckIcon/> Doh-Div poročilo za dividende</li>
                <li><CheckIcon/> Pretekla davčna leta</li>
                <li><CheckIcon/> E-poštna podpora</li>
              </ul>
              <a className="btn btn-primary cta" href="/cenik">Nadgradi na Pro</a>
            </div>
          </div>
          {/* N5: Honest note for small users */}
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            Imate manj kot 10 transakcij letno? Vnos v eDavke je pogosto mogoč tudi ročno — brezplačni načrt vam pomaga pri izračunu.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq" style={{paddingTop:0}}>
        <div className="wrap">
          <div className="text-center reveal" style={{maxWidth:"36em", margin:"0 auto 40px"}}>
            <span className="eyebrow" style={{justifyContent:"center"}}>Pogosta vprašanja</span>
            <h2 className="h-1" style={{marginTop:18}}>Vse, kar te zanima pred prvim izvozom.</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((item, i) => (
              <div className="faq-item reveal" key={i}>
                <button className="faq-q">
                  {item.q}
                  <span className="pm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  </span>
                </button>
                <div className="faq-a"><div className="inner">{item.a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{paddingTop:0}}>
        <div className="wrap">
          <div className="cta-final reveal">
            <span className="eyebrow" style={{justifyContent:"center"}}>Aprilski rok se bliža</span>
            <h2>Tvoja davčna napoved, urejena v 5 minutah.</h2>
            <p>Brezplačno preveri stanje, plačaš samo, če potrebuješ XML za eDavki. Pro je 19 € na davčno leto.</p>
            <div className="row center gap-3" style={{flexWrap:"wrap"}}>
              <a href="/upload" className="btn btn-primary btn-lg">Naloži prvi izpisek <span className="arr">→</span></a>
              <a href="/cenik" className="btn btn-line btn-lg">Cenik</a>
              <a href="/navodila" className="btn btn-ghost btn-lg">Navodila za uvoz</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot" id="kontakt">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a href="/" className="brand">
                <svg viewBox="0 0 28 28" fill="none" style={{width:28,height:28}}>
                  <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)"/>
                  <path d="M7 18 L11 14 L15 16 L20 9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="20" cy="9" r="1.8" fill="#fff"/>
                  <path d="M17 19 L19 21 L23 17" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".85"/>
                </svg>
                DavkiNaDelnicah.si
              </a>
              <p>Davčna napoved brez glavobola. Slovenska spletna storitev za izračun kapitalskega dobička in pripravo XML poročil za FURS.</p>
            </div>
            <div className="foot-col">
              <h4>Produkt</h4>
              <a href="#funkcije">Funkcije</a>
              <a href="/cenik">Cenik</a>
              <a href="/upload">Naloži izpisek</a>
              <a href="/reports">Poročila</a>
            </div>
            <div className="foot-col">
              <h4>Podpora</h4>
              <a href="#faq">Vprašanja</a>
              <a href="/navodila">Navodila za uvoz</a>
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              <span style={{ fontSize: 12, color: "var(--muted-2)", lineHeight: 1.5 }}>
                Odziv v 1 delovnem dnevu
              </span>
            </div>
            <div className="foot-col">
              <h4>Pravno</h4>
              <a href="/terms">Pogoji uporabe</a>
              <a href="/privacy">Politika zasebnosti</a>
            </div>
          </div>

          {/* Podatki o ponudniku — ZVPot-1 čl. 43 (obvezno za e-commerce) */}
          {/* ⚠️ ZAMENJAJ VSE VREDNOSTI Z RESNIČNIMI PODATKI */}
          <div style={{
            borderTop: "1px solid var(--line-soft)",
            paddingTop: 20,
            marginBottom: 16,
            fontSize: 12,
            color: "var(--muted-2)",
            lineHeight: 2,
          }}>
            <strong style={{ color: "var(--muted)", display: "block", marginBottom: 4, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase" }}>
              Podatki o podjetju
            </strong>
            ⚠️ [IME PODJETJA ali S.P.] · ⚠️ [NASLOV], Slovenija
            <br />
            Mat. številka: ⚠️ [MATICNA] · ID za DDV: ⚠️ SI[DDVSTEVILKA] (ali: ni zavezanec po 94. čl. ZDDV-1)
            <br />
            Kontakt: <a href="mailto:podpora@davkinadelnicah.si" style={{ color: "var(--muted)" }}>podpora@davkinadelnicah.si</a>
          </div>

          <p style={{ fontSize: 11, color: "var(--muted-2)", marginBottom: 12 }}>
            Uporabljamo samo nujne piškotke za prijavo in delovanje aplikacije — brez analitičnih
            ali oglaševalskih piškotkov tretjih oseb.
          </p>
          <div className="foot-bottom">
            <p>© {new Date().getFullYear()} DavkiNaDelnicah.si · Ni davčni svetovalec — informativni izračun.</p>
            <p>v1.4.0 · Slovenija</p>
          </div>
        </div>
      </footer>
    </>
  );
}