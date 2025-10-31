// src/pages/Primjeri.tsx
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LayoutGrid } from "lucide-react";
import { AltItem } from "@/types";
import { Button } from "@/components/ui/Button";

/** — Tema identično kao na ostalim stranicama (Header fiksan + pt offset) — */
export default function Primjeri() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kpd_theme");
    const pref = saved ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setDark(pref === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kpd_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen">
      <Header dark={dark} setDark={setDark} />

      <main className="pt-16 sm:pt-20 mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Naslov */}
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Primjeri KPD pretraga i postupak rezultata
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Kako dolazimo do točnih i provjerljivih KPD šifri.
          </p>
        </header>

        {/* Sažeti opis metode — bez otkrivanja pune procedure */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Kako postižemo visoku točnost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-800 dark:text-slate-200">
            <p>
              Sustav koristi <b>službene dokumente DZS-a</b> (KPD 2025 i NKD 2025). Rezultati su zato{" "}
              <b>usklađeni s pravilima</b> i lako provjerljivi.
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>
                <b>Razumijemo upit</b> (što se točno traži: proizvod, usluga, ugradnja, prodaja…).
              </li>
              <li>
                <b>Sužavamo područje</b> na odgovarajuću djelatnost i zatim biramo <b>točnu KPD šifru</b>.
              </li>
              <li>
                <b>Provjeravamo naziv i napomene</b> iz službenih tekstova kako bismo izbjegli pogrešna tumačenja.
              </li>
              <li>
                Po potrebi prikažemo i <b>2–3 srodne opcije</b> uz kratko objašnjenje.
              </li>
            </ul>

            <p>
              Ovim pristupom redovito postižemo <b>vrlo visoku točnost</b> na provjerenim primjerima. Ako opis nije
              dovoljno jasan, sustav to <b>izričito navede</b> umjesto da pogađa.
            </p>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Napomena: svaki rezultat se temelji na <b>transparentnim, službenim</b> DZS dokumentima, pa ga je uvijek
              moguće ponovno provjeriti.
            </p>
          </CardContent>
        </Card>

        {/* Primjeri — statički prikaz (prenijeto iz App.tsx) */}
        <section id="primjeri" className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-center">Primjeri iz aplikacije</h2>
          <p className="text-center text-slate-600 dark:text-slate-300">
            Ispod su primjeri razvrstavanja s kratkim obrazloženjem.
          </p>

          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {examplesStatic.map((ex) => (
              <Card key={ex.label} className="hover:shadow-md transition">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <CardTitle className="text-base">{ex.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <div className="text-xs uppercase text-slate-500">KPD</div>
                    <div className="text-sm font-semibold">{ex.KPD_6 ?? "∅"}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {ex.KPD_naziv ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-500">NKD</div>
                    <div className="text-sm font-semibold">{ex.NKD_4}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">{ex.NKD_naziv}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-500">Obrazloženje</div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{ex.Razlog_odabira}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-500">Alternativne šifre</div>
                    {!ex.alternativne.length ? (
                      <p className="text-xs text-slate-500">—</p>
                    ) : (
                      <ul className="text-xs space-y-1">
                        {ex.alternativne.map((a) => (
                          <li key={`${a.KPD_6}-${a.Naziv}`}>
                            <span className="font-mono">{a.KPD_6}</span>{" "}
                            <span className="text-slate-600 dark:text-slate-300">— {a.Naziv}</span>
                            {a["kratko_zašto"] && (
                              <span className="text-slate-500"> ({a["kratko_zašto"]})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        {/* CTA */}
                        <div className="text-center">
                          <a href="/" className="inline-block">
                            <Button>Vrati se na KPD info DEMO</Button>
                          </a>
                        </div>

        <p className="mt-10 text-center text-xs text-slate-500">
          Radi isključivo na temelju službenih NKD/KPD 2025 dokumenata učitanih u agenta. ✦ Izradio: MIAI — info@kpdinfo.com
        </p>
          
      </main>
    </div>
  );
}

/** ---------- STATIC PRIMJERI (prenijeti iz App.tsx) ---------- */
const examplesStatic: Array<{
  label: string;
  NKD_4: string;
  NKD_naziv: string;
  KPD_6: string | null;
  KPD_naziv: string | null;
  Razlog_odabira: string;
  alternativne: AltItem[];
}> = [
  {
    label: "Prodaja stolica u salonu",
    KPD_6: "47.55.01",
    KPD_naziv: "Usluge trgovine na malo namještajem",
    NKD_4: "47.55.0",
    NKD_naziv: "trgovina na malo namještajem",
    Razlog_odabira:
      "Opis „prodaja stolice u salonu” upućuje na specijaliziranu trgovinu na malo namještajem; NKD 47.55.0 izričito uključuje trgovinu na malo namještajem (uključujući madrace i podnice) te ostalom opremom za kućanstvo . U KPD-u, unutar istog prefiksa, šifra 47.55.01 je „Usluge trgovine na malo namještajem”, što najuže odgovara prodaji stolica u salonu.",
    alternativne: [
      {
        KPD_6: "47.55.02",
        Naziv: "Usluge trgovine na malo opremom za rasvjetu",
        "kratko_zašto": "Relevantno ako se u istom salonu prodaje i rasvjeta uz namještaj .",
      },
      {
        KPD_6: "47.55.03",
        Naziv: "Usluge trgovine na malo drvenim, plutenim i pletarskim proizvodima",
        "kratko_zašto":
          "Moguće ako je asortiman proširen na proizvode od drva/pluta/pruća za kućanstvo .",
      },
      {
        KPD_6: "47.55.04",
        Naziv:
          " Usluge trgovine na malo grnčarijom, staklenim proizvodima, porculanom, loncima, priborom za jelo i neelektričnim aparatima za kućanstvo, proizvodima i opremom",
        "kratko_zašto":
          "Primjenjivo ako salon nudi i prateće artikle za opremanje doma uz namještaj .",
      },
    ],
  },
  {
    label: "Izrada web stranice",
    KPD_6: "62.10.11",
    KPD_naziv: "Usluge IT dizajna i razvoja aplikacija",
    NKD_4: "62.10.9",
    NKD_naziv: "Ostalo računalno programiranje",
    Razlog_odabira:
      "Izrada web stranice razvrstava se u NKD 62.10.9 jer ovaj podrazred izričito uključuje izradu i održavanje softvera te baza podataka i internetskih stranica . Također, NKD 74.12 (grafički dizajn) izričito upućuje da je kreiranje mrežnih stranica u kombinaciji s programiranjem djelatnost iz 62.10.9 . U KPD 2025 odgovarajuća usluga je 62.10.11 – Usluge IT dizajna i razvoja aplikacija.",
    alternativne: [
      {
        KPD_6: "62.10.12",
        Naziv: "Usluge IT dizajna i razvoja mreža i sustava",
        "kratko_zašto":
          "Ako projekt uključuje projektiranje mrežne/sustavske infrastrukture uz web rješenje.",
      },
      {
        KPD_6: "62.10.22",
        Naziv: "Ostali originalni softver",
        "kratko_zašto":
          "Ako se isporučuje gotov originalni softver (proizvod) umjesto usluge razvoja.",
      },
    ],
  },
  {
    label: "Prodaja i ugradnja klima uređaja",
    KPD_6: "43.22.12",
    KPD_naziv: "instalacijski radovi vodovoda, grijanja i klimatizacije",
    NKD_4: "43.22.0",
    NKD_naziv: "Ugradnja klima uređaja",
    Razlog_odabira:
      "Ugradnja klima uređaja spada u NKD 43.22.0 jer ovaj podrazred obuhvaća postavljanje, održavanje i popravak opreme i vodova za ventilaciju i klimatizaciju, uključujući sustave grijanja i klimatizacije . U KPD 2025, šifra 43.22.12 točno označava radove na uvođenju instalacija za grijanje, ventilaciju i klimatizaciju, što odgovara usluzi ugradnje klima uređaja .",
    alternativne: [
      {
        KPD_6: "47.54.00",
        Naziv: "Usluge trgovine na malo električnim aparatima za kućanstvo",
        "kratko_zašto":
          "Ako se radi samo o prodaji klima uređaja bez montaže (druga domena – trgovina na malo).",
      },
      {
        KPD_6: "43.22.11",
        Naziv: "Radovi na uvođenju instalacija za vodovod i kanalizaciju (odvod)",
        "kratko_zašto":
          "(Srodno istom prefiksu; može biti relevantno ako su radovi povezani s odvodom kondenzata ili dodatnim vodoinstalaterskim zahvatima.",
      },
    ],

    
  },

  
];

