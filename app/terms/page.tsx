import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "2. junij 2026";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "podpora@davkinadelnicah.si";

export const metadata: Metadata = buildMetadata({
  title: "Pogoji uporabe | DavkiNaDelnicah.si",
  description:
    "Pogoji uporabe spletne storitve DavkiNaDelnicah.si za pripravo davčnih napovedi po pravilih FURS.",
  path: "/terms",
  noOgImage: true,
});

export default function TermsPage() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap" style={{ maxWidth: 800 }}>
          <h1>Pogoji uporabe</h1>
          <p>Zadnja posodobitev: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="wrap" style={{ maxWidth: 800, paddingBottom: 80 }}>
        <div className="prose">

          <h2>1. Sprejem pogojev</h2>
          <p>
            Z registracijo ali uporabo spletne storitve DavkiNaDelnicah.si (v nadaljevanju: storitev)
            sprejmate te Pogoje uporabe v celoti. Če s pogoji ne soglašate, storitve ne smete
            uporabljati. Pogoji so veljavni za vse obiske in vse račune, ustvarjene na tej storitvi.
          </p>

          <h2>2. Opis storitve</h2>
          <p>
            DavkiNaDelnicah.si je informativno spletno orodje, namenjeno slovenskim vlagateljem, ki
            jim pomaga pri:
          </p>
          <ul>
            <li>uvozu transakcijskih izpiskov (CSV) iz borznih posrednikov,</li>
            <li>samodejnem izračunu kapitalskega dobička po metodi FIFO,</li>
            <li>
              pripravi davčnih obrazcev DOH-KDVP in DOH-DIV v obliki XML za uvoz v portal eDavki.
            </li>
          </ul>
          <p>
            Storitev <strong>ne nadomešča individualnega davčnega svetovanja</strong>. Za specifične
            davčne situacije, kompleksne portfelje ali dvom glede pravilnosti izračuna priporočamo
            posvet s pooblaščenim davčnim svetovalcem.
          </p>

          <h2>3. Odgovornost uporabnika</h2>
          <p>Kot uporabnik storitve ste odgovorni za:</p>
          <ul>
            <li>
              <strong>Pravilnost uvoženih podatkov.</strong> Zagotoviti morate, da so CSV datoteke,
              ki jih uvažate, popolne in točne. Napake v izvornih podatkih (manjkajoče transakcije,
              nepopolni izpiski, napačni datumi) se neposredno odrazijo v izračunu in generiranem XML.
            </li>
            <li>
              <strong>Pregled generiranih dokumentov.</strong> Pred oddajo XML datoteke v eDavki
              morate vsebino preveriti — posebej zneske, datume in identifikatorje naložbenih
              instrumentov. Morebitne napake je treba popraviti pred oddajo.
            </li>
            <li>
              <strong>Pravočasno oddajo napovedi.</strong> Za spoštovanje zakonskih rokov za oddajo
              davčnih napovedi pri FURS je odgovoren izključno uporabnik sam.
            </li>
            <li>
              <strong>Varnost računa.</strong> Za varstvo gesla in dostopa do vašega računa ste
              odgovorni sami. O morebitnem nepooblaščenem dostopu nas nemudoma obvestite.
            </li>
          </ul>

          <h2>4. Omejitev odgovornosti</h2>
          <p>
            DavkiNaDelnicah.si zagotavlja storitev <strong>po načelu "kot je"</strong> (as-is), brez
            jamstev o točnosti izračunov v vseh mogočih davčnih situacijah.
          </p>
          <p>Izrecno izključujemo odgovornost za:</p>
          <ul>
            <li>
              davčne zamude, kazni ali obresti, ki bi nastale na podlagi napačno uvoženih podatkov
              ali napačne razlage izračuna;
            </li>
            <li>
              spremembe v davčni zakonodaji, ki bi zahtevale drugačno metodologijo po oddaji vaše
              napovedi;
            </li>
            <li>
              izgubo podatkov zaradi nerazpoložljivosti strežnikov ali višje sile;
            </li>
            <li>
              posredne ali posledične škode, ki bi izhajale iz uporabe ali nezmožnosti uporabe
              storitve.
            </li>
          </ul>
          <p>
            Skupna odgovornost ponudnika v nobenem primeru ne presega zneska, ki ste ga plačali za
            storitev v zadnjih 12 mesecih pred nastankom škode.
          </p>

          <h2>5. Pro načrt — plačila in dostop</h2>
          <p>Storitev je dostopna v dveh načrtih:</p>
          <ul>
            <li>
              <strong>Brezplačni načrt:</strong> do 200 transakcij, brez XML izvoza. Dostopen brez
              plačila.
            </li>
            <li>
              <strong>Pro načrt:</strong> neomejene transakcije, DOH-KDVP in DOH-DIV XML izvoz,
              pretekla davčna leta. Cena: <strong>19 € za eno davčno leto</strong> (12 mesecev od
              datuma aktivacije). DDV ni obračunan (mali davčni zavezanec po 94. čl. ZDDV-1).
            </li>
          </ul>
          <p>
            <strong>Samodejne obnove ni.</strong> Po izteku Pro dostopa se naročnina ne obnovi
            samodejno. Za naslednje leto se odločite sami.
          </p>
          <p>
            Plačila obdeluje Stripe Inc. Po uspešnem plačilu prejmete potrdilo po e-pošti. Račun za
            pravne osebe je na voljo — med plačilom vnesite podatke podjetja (naziv, naslov, davčna
            številka).
          </p>
          <p>
            Nudimo <strong>30-dnevno garancijo vračila</strong> brez vprašanj. Zahtevo pošljite na{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>

          <h2>6. Prekinitev in spremembe storitve</h2>
          <p>Pridržujemo si pravico do:</p>
          <ul>
            <li>
              <strong>Spremembe pogojev:</strong> o bistvenih spremembah vas obvestimo po e-pošti
              vsaj 14 dni pred uveljavitvijo.
            </li>
            <li>
              <strong>Vzdrževalnih prekinitev:</strong> storitev lahko začasno prekinemo za
              vzdrževanje; o daljših prekinitvah obvestimo vnaprej.
            </li>
            <li>
              <strong>Ukinitve storitve:</strong> v primeru trajne ukinitve zagotovimo možnost
              izvoza vseh vaših podatkov in vračilo sorazmernega dela plačila za neporabljeno obdobje
              Pro.
            </li>
          </ul>

          <h2>7. Varstvo osebnih podatkov</h2>
          <p>
            Obdelavo osebnih podatkov urejamo v ločenem dokumentu:{" "}
            <a href="/privacy">Politika zasebnosti</a>. Politika zasebnosti je sestavni del teh
            Pogojev uporabe.
          </p>

          <h2>8. Intelektualna lastnina</h2>
          <p>
            Vsa programska oprema, design, besedila in blagovne znamke na tej storitvi so last
            ponudnika in zaščiteni z veljavno zakonodajo. Prepovedano je kopiranje, razmnoževanje ali
            distribuiranje vsebine brez pisnega soglasja.
          </p>

          <h2>9. Kontakt</h2>
          <p>Za vprašanja v zvezi s Pogoji uporabe ali s storitvijo:</p>
          <p
            style={{
              paddingLeft: 20,
              borderLeft: "3px solid var(--line)",
              color: "var(--ink-soft)",
            }}
          >
            <strong>DavkiNaDelnicah.si</strong>
            <br />
            E-pošta: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            <br />
            Odzivni čas: običajno v 1 delovnem dnevu
          </p>

          <h2>10. Veljavno pravo in reševanje sporov</h2>
          <p>
            Za te Pogoje uporabe in vsa razmerja med uporabnikom in ponudnikom velja{" "}
            <strong>pravo Republike Slovenije</strong>. Pristojno sodišče za morebitne spore je
            sodišče v kraju sedeža ponudnika.
          </p>
          <p>
            Pred sprožitvijo sodnega postopka vas prosimo, da spor poskusite rešiti z direktnim
            stikom na zgornji e-poštni naslov.
          </p>

        </div>
      </section>
    </main>
  );
}
