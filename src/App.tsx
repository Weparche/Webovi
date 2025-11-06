import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card,CardKPD, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, Moon, Search, Sparkles, LayoutGrid, SunMedium, Trash2 } from "lucide-react";
import { AltItem, KpdResponse, pretty, validateResponse } from "@/types";
import Kontakt from "@/pages/Kontakt";
import CookieConsent from "@/components/CookieConsent";


/** --- DEMO fallback (koristi se samo ako API padne) --- */
// function demoMock(query: string): KpdResponse {
//   const isWeb = /web|stranic/i.test(query);
//   if (isWeb) {
//     return {
//       NKD_4: "62.01.0",
//       NKD_naziv: "računalno programiranje po narudžbi",
//       KPD_6: null,
//       Naziv_proizvoda: null,
//       Razlog_odabira:
//         "Izrada web stranice spada u računalno programiranje po narudžbi (NKD 62.01.0).",
//       Poruka:
//         "Za ovaj NKD ne postoji precizna KPD šifra. Predlažemo srodne iz istog područja.",
//       alternativne: [
//         { KPD_6: "62.01.01", Naziv: "Usluge izrade računalnih programa po narudžbi", "kratko_zašto": "Ako uključuje razvoj rješenja." },
//         { KPD_6: "62.02.01", Naziv: "Usluge savjetovanja u vezi s računalima", "kratko_zašto": "Ako je fokus na savjetovanju." },
//         { KPD_6: "63.11.01", Naziv: "Usluge web portala", "kratko_zašto": "Ako se radi o portalu/održavanju." },
//       ],
//     };
//   }
//   return {
//     NKD_4: "47.55.0",
//     NKD_naziv: "trgovina na malo namještajem",
//     KPD_6: "47.55.01",
//     Naziv_proizvoda: "Usluge trgovine na malo namještajem",
//     Razlog_odabira:
//       "Prodaja stolica u salonu spada u trgovinu na malo namještajem (NKD 47.55.0); KPD 47.55.01 pokriva ovu djelatnost.",
//     Poruka: null,
//     alternativne: [
//       { KPD_6: "47.59.01", Naziv: "Usluge trgovine na malo ostalim kućanskim proizvodima", "kratko_zašto": "Ako nije striktno namještaj." },
//       { KPD_6: "47.59.09", Naziv: "Ostale usluge trgovine na malo posebnih proizvoda", "kratko_zašto": "Srodno području trgovine." },
//     ],
//   };
// }

/** ---- Tip za stavku povijesti (snapshot) ---- */
type HistItem = {
  q: string;
  nkd: string | null;
  nkd_naziv: string | null;
  kpd: string | null;
  kpd_naziv: string | null;
  razlog: string | null;
  ts: number;
  alternativne?: AltItem[]; // ← DODANO (opcionalno)
};

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  /** ---- status koji se mijenja svakih 3s bez ponavljanja ---- */
  const statusStepsBase = useMemo(
    () => [
      "Pretražujem NKD…",
      "Našao NKD.",
      "Pretražujem odgovarajući KPD…",
      "Usklađujem rezultate…",
      "Provjeravam alternativne šifre…",
      "Još malo AI razmišljanja…",
      "Boli me neuronska mreža...",
      "Finaliziram odgovor…",
    ],
    []
  );
  const [statusIdx, setStatusIdx] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      setStatusIdx(0);
      timerRef.current = window.setInterval(() => {
        setStatusIdx((i) => (i + 1 < statusStepsBase.length ? i + 1 : i));
      }, 5000);
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading, statusStepsBase.length]);

  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<KpdResponse | null>(null);
  const [rawJson, setRawJson] = useState("{}");
  const [dark, setDark] = useState(false);
  // const [apiUrl] = useState<string>(
  //   import.meta.env.VITE_API_URL ||
  //     ((location.hostname === "localhost" || location.hostname.startsWith("192.168."))
  //       ? "http://localhost:3001/api/kpdinfo/classify"
  //       : "/api/kpdinfo/classify")
  // );

  const [apiUrl] = useState<string>("/api/kpdinfo/classify");

  /** --------- CAPTCHA (jednostavna zbrajalica) ---------- */
  const [capA, setCapA] = useState(0);
  const [capB, setCapB] = useState(0);
  const [capAns, setCapAns] = useState("");
  const capSum = capA + capB;
  const capValid = useMemo(() => Number(capAns) === capSum, [capAns, capSum]);

  function regenCaptcha() {
    const a = 2 + Math.floor(Math.random() * 8);
    const b = 2 + Math.floor(Math.random() * 8);
    setCapA(a);
    setCapB(b);
    setCapAns("");
  }

  /** --------- Povijest upita (persist u localStorage) ------------ */
  const [history, setHistory] = useState<HistItem[]>([]);
  const HISTORY_KEY = "kpd_history_v2"; // nova verzija jer struktura sad uključuje cijeli snapshot

  useEffect(() => {
    const saved = localStorage.getItem("kpd_theme");
    const pref =
      saved ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setDark(pref === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kpd_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const last = localStorage.getItem("kpd_last");
    if (last) setQuery(last);

    const hist = localStorage.getItem(HISTORY_KEY);
    if (hist) {
      try {
        const arr = JSON.parse(hist);
        if (Array.isArray(arr)) setHistory(arr);
      } catch {}
    }

    regenCaptcha();
  }, []);

  const statusText = useMemo(() => {
    if (loading) return statusStepsBase[Math.min(statusIdx, statusStepsBase.length - 1)];
    if (error) return error;
    if (data) return "Uspješna pretraga, rezultati ispod!";
    return "";
  }, [loading, error, data, statusIdx, statusStepsBase]);

 
  async function callApi(inputText: string): Promise<KpdResponse> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_as_text: inputText }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  function pushHistoryTop(q: string, resp: KpdResponse) {
    const item: HistItem = {
      q,
      nkd: resp.NKD_4 ?? null,
      nkd_naziv: resp.NKD_naziv ?? null,
      kpd: resp.KPD_6 ?? null,
      kpd_naziv: resp.Naziv_proizvoda ?? null,
      razlog: resp.Razlog_odabira ?? null,
      alternativne: resp.alternativne ?? [],
      ts: Date.now(),
    };
    setHistory((prev) => {
      // ukloni eventualne duplikate po (q + kpd + nkd) i stavi novi na vrh
      const next = [item, ...prev.filter(p => !(p.q === item.q && p.kpd === item.kpd && p.nkd === item.nkd))].slice(0, 100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function runCore(text: string) {
  setError(null);
  setLoading(true);
  setData(null);
  setRawJson("{}");

  try {
    const resp = await callApi(text);        // mora vratiti KpdResponse
    console.log("API RESP:", resp);
    validateResponse(resp);                  // baci grešku ako schema ne valja
    setData(resp);
    setRawJson(pretty(resp));
    pushHistoryTop(text, resp);
  } catch (e: any) {
    setError(e?.message ?? String(e));
  } finally {
    setLoading(false);
    regenCaptcha();
  }
}


  async function run() {
    const q = query.trim();
    if (!q) {
      setError("Unesi opis prije traženja.");
      return;
    }
    if (!capValid) {
      setError("Potvrdi CAPTCHA (točan zbroj) prije pokretanja.");
      return;
    }
    localStorage.setItem("kpd_last", q);
    await runCore(q);
  }

  /** STATIC Primjeri (bez pokretanja; samo HTML) */
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
        { KPD_6: "47.55.02", Naziv: "Usluge trgovine na malo opremom za rasvjetu", "kratko_zašto": "Relevantno ako se u istom salonu prodaje i rasvjeta uz namještaj ." },
        { KPD_6: "47.55.03", Naziv: "Usluge trgovine na malo drvenim, plutenim i pletarskim proizvodima", "kratko_zašto": "Moguće ako je asortiman proširen na proizvode od drva/pluta/pruća za kućanstvo ." },
        { KPD_6: "47.55.04", Naziv: " Usluge trgovine na malo grnčarijom, staklenim proizvodima, porculanom, loncima, priborom za jelo i neelektričnim aparatima za kućanstvo, proizvodima i opremom", "kratko_zašto": "Primjenjivo ako salon nudi i prateće artikle za opremanje doma uz namještaj ." },
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
        { KPD_6: "62.10.12", Naziv: "Usluge IT dizajna i razvoja mreža i sustava", "kratko_zašto": "Ako projekt uključuje projektiranje mrežne/sustavske infrastrukture uz web rješenje." },
        { KPD_6: "62.10.22", Naziv: "Ostali originalni softver", "kratko_zašto": "Ako se isporučuje gotov originalni softver (proizvod) umjesto usluge razvoja." },
      ],
    },
    {
      label: "Prodaja i ugradnja klima uređaja",
      KPD_6: "43.22.12",
      KPD_naziv: "Radovi na uvođenju instalacija za grijanje, ventilaciju i klimatizaciju",
      NKD_4: "43.22.0",
      NKD_naziv: "Uvođenje instalacija vodovoda, kanalizacije i plina te instalacija za grijanje i klimatizaciju",      
      Razlog_odabira:
        "Ugradnja klima uređaja spada u NKD 43.22.0 jer ovaj podrazred obuhvaća postavljanje, održavanje i popravak opreme i vodova za ventilaciju i klimatizaciju, uključujući sustave grijanja i klimatizacije . U KPD 2025, šifra 43.22.12 točno označava radove na uvođenju instalacija za grijanje, ventilaciju i klimatizaciju, što odgovara usluzi ugradnje klima uređaja .",
      alternativne: [
        { KPD_6: "47.54.00", Naziv: "Usluge trgovine na malo električnim aparatima za kućanstvo", "kratko_zašto": "Ako se radi samo o prodaji klima uređaja bez montaže (druga domena – trgovina na malo)." },
        { KPD_6: "43.22.11", Naziv: "Radovi na uvođenju instalacija za vodovod i kanalizaciju (odvod)", "kratko_zašto": "(Srodno istom prefiksu; može biti relevantno ako su radovi povezani s odvodom kondenzata ili dodatnim vodoinstalaterskim zahvatima." },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Plavi glow za status (jednostavna animacija) */}
      <style>{`
        @keyframes glowBlue {
          0%, 70% { text-shadow: 0 0 0px rgba(37, 99, 235, 0.0); }
          50% { text-shadow: 0 0 12px rgba(37, 99, 235, 0.55); }
        }
        .animate-glow { animation: glowBlue 1.8s ease-in-out infinite; }
      `}</style>

      <Header dark={dark} setDark={setDark} />
{/* Cookie banner */}
<CookieConsent />

      {/* GLOBALNA POZADINA — 50% prozirna, preko cijele stranice */}
{/* <div
  aria-hidden="true"
  className="pointer-events-none fixed inset-0 -z-10 bg-[url('/background.jpg')] bg-cover bg-center opacity-10"
/> */}



      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-5">

        {/* --- ZAŠTO KPDinfo AI tražilica --- */}
{/* --- ZAŠTO KPDinfo AI tražilica (Card verzija) --- */}
<section
  id="zasto-kpdinfo"
  className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
>
  <div className="mx-auto max-w-6xl px-4 py-4 sm:py-1">
    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
      Zašto <span className="text-blue-600 dark:text-blue-400">KPD info</span> AI tražilica?
    </h2>

    <div className="mt-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-700 dark:text-slate-300">
            KPDinfo AI alat ubrzava i standardizira razvrstavanje proizvoda i usluga prema <b>KPD 2025</b>, uz istodobno
            usklađivanje s pripadnim <b>NKD 2025</b> podrazredom. Radi isključivo na temelju službenih dokumenata
            <b> Državnog zavoda za statistiku</b>, koji su učitani u sustav, pa su rezultati transparentni, ponovljivi
            i jednostavni za provjeru.
          </p>

          <div className="mt-4 min-h-5 flex items-center justify-center text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Za sve službene KPD upite obratite se na adresu Državnog zavoda za statistiku —{" "}
              <a
                href="mailto:klasifikacija@dzs.hr"
                className="underline underline-offset-2"
              >
                klasifikacija@dzs.hr
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</section>



        <Card>
          <CardContent className="pt-2 space-y-1">
            {/* 3-stupčana mreža: [upit] [captcha] [gumbi] */}
            <div className="grid gap-3 items-start md:grid-cols-[1fr_240px_160px]">
              {/* Lijevo: upit */}
              <div>
                <label htmlFor="inp" className="block text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 animate-glow font-bold">Isprobajte besplatni DEMO!</span>
                 <br /> Opiši proizvod/uslugu ili kombinaciju (npr. "prodaja i ugradnja klima uređaja") 
                </label>
                <Textarea
                  id="inp"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mt-2 h-28"
                  placeholder="npr. Prodaja stolica u salonu ili Izrada web stranice za klijenta"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run();
                  }}
                />
                {/* <p className="mt-2 text-xs text-slate-500">
                  Prečaci: <kbd className="px-1.5 py-0.5 border rounded">Ctrl</kbd>+
                  <kbd className="px-1.5 py-0.5 border rounded">Enter</kbd> za pokretanje.
                </p> */}
              </div>

              {/* Sredina: CAPTCHA u razini s upitom */}
              <div className="md:self-start md:mt-6">
                <label className="block text-sm text-slate-600 dark:text-slate-300 font-medium">
                  CAPTCHA
                  <span className="ml-1 text-slate-500 text-xs">(obavezno)</span>
                </label>
                <div className="mt-2">
                  <div className="text-sm mb-1">
                    Koliko je <span className="font-semibold">{capA} + {capB}</span>?
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={capAns}
                    onChange={(e) => setCapAns(e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-900
                      ${capAns ? (capValid ? "border-emerald-500" : "border-rose-500") : "border-slate-300 dark:border-slate-700"}`}
                    placeholder="Upiši zbroj"
                    aria-invalid={!!capAns && !capValid}
                    aria-describedby="cap-help"
                  />
                  <div id="cap-help" className="mt-1 flex items-center justify-between">
                    <span className={`text-xs ${capAns ? (capValid ? "text-emerald-600" : "text-rose-600") : "text-slate-500"}`}>
                      {capAns ? (capValid ? "Točno." : "Netočno.") : "Obavezno prije slanja."}
                    </span>
                    <button
                      type="button"
                      onClick={regenCaptcha}
                      className="text-xs underline hover:no-underline"
                      title="Generiraj novu CAPTCHA vrijednost"
                    >
                      Nova
                    </button>
                  </div>
                </div>
              </div>

              {/* Desno: gumbi poravnati s vrhom */}
              <div className="flex md:flex-col gap-2 md:self-start md:mt-8">
                <Button
                  onClick={run}
                  disabled={loading || !capValid}
                  title={!capValid ? "Za upit je potrebno prvo odgovoriti na CAPTCHA-u" : undefined}
                  className="w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Obrada…
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Klasificiraj
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setData(null);
                    setRawJson("{}");
                    setError(null);
                    setHistory([]);
                    localStorage.removeItem("kpd_last");
                    localStorage.removeItem(HISTORY_KEY);
                    regenCaptcha();
                  }}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Očisti
                </Button>
              </div>
            </div>

            {/* STATUS s plavim glowom + loader ikonom */}
            <div className="text-sm min-h-[1rem]" role="status" aria-live="polite">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 animate-glow font-bold">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{statusText}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 animate-glow font-bold">{statusText}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mt-6">
            <CardContent className="pt-6 text-sm text-rose-700 dark:text-rose-400">
              Greška: {error}
            </CardContent>
          </Card>
        )}

        {data && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* KPD */}
            <CardKPD>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className={`border-2 ${data.KPD_6 ? "border-green-700 text-green-700 dark:text-green-400" : "border-rose-600 text-rose-700 dark:text-rose-400"}`}>
                    {data.KPD_6 ? "KPD šifra — pronađeno" : "KPD šifra — nije pronađeno"}
                  </Badge>
                  <CardTitle>KPD proizvod/usluga</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{data.KPD_6 ?? "∅"}</div>
                <p className="mt-2 text-base sm:text-lg text-slate-700 dark:text-slate-200">
                  {data.Naziv_proizvoda ?? "—"}
                </p>
                {(!data.KPD_6 || data.Poruka) && (
                  <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">
                    {data.Poruka || "Šifra nije pronađena u KPD 2025 bazi."}
                  </p>
                )}
              </CardContent>
            </CardKPD>
            {/* NKD */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="border border-green-600 text-green-700 dark:text-green-400">NKD šifra</Badge>
                  <CardTitle>NKD podrazred</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{data.NKD_4 || "—"}</div>
                <div className="mt-2 text-base sm:text-lg text-slate-700 dark:text-slate-200">
                  {data.NKD_naziv ?? "Naziv NKD podrazreda nije dostupan."}
                </div>
              </CardContent>
            </Card>

            
          </div>
        )}

        {/* Obrazloženje */}
        {data && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl sm:text-xl">Obrazloženje izbora</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-mg text-slate-700 dark:text-slate-300">
                {data.Razlog_odabira || "—"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Alternativne šifre */}
{data?.alternativne?.length ? (
  <Card className="mt-6">
    <CardHeader className="pb-3">
      <CardTitle className="text-xl sm:text-xl">Alternativne KPD šifre</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="text-sm space-y-2">
        {/* Header reda */}
        <li className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs uppercase text-slate-500 tracking-wide">
          <span>KPD šifra</span>
          <span>Naziv proizvoda</span>
          <span>Obrazloženje</span>
        </li>

        {/* Redovi s podacima */}
        {data.alternativne.map((a, idx) => {
          // toleriraj i "kratko_zasto" bez dijakritika ako backend to šalje
          const kratko =
            (a as any)["kratko_zašto"] ??
            (a as any).kratko_zasto ??
            "";
          return (
            <li
              key={`${a.KPD_6 ?? "∅"}-${idx}`}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 leading-snug border-b last:border-b-0 border-slate-200/60 dark:border-slate-700/60 py-2"
            >
              {/* KPD šifra */}
              <span className="font-mono">{a.KPD_6 ?? "∅"}</span>

              {/* Naziv proizvoda */}
              <span className="text-slate-700 dark:text-slate-200">{a.Naziv ?? ""}</span>

              {/* Obrazloženje */}
              <span className="text-slate-500">
                {kratko || ""}
              </span>
            </li>
          );
        })}
      </ul>
    </CardContent>
  </Card>
) : null}


        {/* POVIJEST UPITA – prikaz cijelog rezultata */}
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Povijest upita
          </h3>

          {history.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Još nema spremljenih upita.</p>
          ) : (
            <div className="mt-3 grid gap-4">
              {history.map((h, i) => (
                <Card key={`${h.ts}-${i}`} className="hover:shadow-md transition">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base leading-snug">
                          Upit: {h.q} 
                        </CardTitle>
                        <div className="text-xs text-slate-500">
                          {new Date(h.ts).toLocaleString()}
                        </div>
                      </div>
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery(h.q)}
                        title="Ubaci ovaj upit u polje"
                        className="shrink-0"
                      >
                        Učitaj
                      </Button> */}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
  <div className="grid gap-3 sm:grid-cols-2">
    {/* KPD kartica */}
    <div className="rounded-lg border-2 p-3 border-green-500 dark:border-green-600 bg-white/80 dark:bg-slate-900/70 backdrop-blur">
      <div className="flex items-center gap-2 mb-1">
        <Badge className={`border ${h.kpd ? "border-green-600 text-green-700 dark:text-green-400" : "border-rose-600 text-rose-700 dark:text-rose-400"}`}>
          {h.kpd ? "KPD šifra — pronađeno" : "KPD šifra — nije pronađeno"}
        </Badge>
        <span className="text-sm font-semibold">{h.kpd ?? "∅"}</span>
      </div>
      <div className="text-sm text-slate-700 dark:text-slate-200">
        {h.kpd_naziv ?? "—"}
      </div>
    </div>

    {/* NKD kartica */}
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-1">
        <Badge className="border border-green-600 text-green-700 dark:text-green-400">NKD šifra</Badge>
        <span className="text-sm font-semibold">{h.nkd ?? "—"}</span>
      </div>
      <div className="text-sm text-slate-700 dark:text-slate-200">        
        {h.nkd_naziv ?? "—"}
      </div>
    </div>
  </div>

  {/* Obrazloženje */}
  <div className="mt-3">
    <div className="text-xs uppercase text-slate-500 mb-1">Obrazloženje</div>
    <p className="text-sm text-slate-700 dark:text-slate-300">
      {h.razlog ?? "—"}
    </p>
  </div>

  {/* Alternativne šifre (KPD) */}
  {Array.isArray(h.alternativne) && h.alternativne?.length > 0 && (
    <div className="mt-4">
      <div className="text-sm font-semibold uppercase text-slate-500 mb-1">Alternativne šifre (KPD)</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {h.alternativne.map((alt, i) => (
          <div
            key={i}
            className="rounded-lg border p-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur"
          >
            <div className="flex items-center gap-2 mb-1">
              <Badge className="border border-slate-300 dark:border-slate-700">KPD šifra</Badge>
              <span className="text-sm font-semibold">{alt.KPD_6 ?? "∅"}</span>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-200 gap-2">
              <Badge className="border border-slate-300 dark:border-slate-700">Naziv</Badge>
              <span className="text-sm font-semibold">{alt.Naziv ?? "—"}</span>              
            </div>
            {alt["kratko_zašto"] && (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {alt["kratko_zašto"]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )}
</CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* STATIC Primjeri — samo HTML (bez pokretanja) */}
        <div id="primjeri" className="mt-10">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Primjeri upita KPD pretraga
          </h3>
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
                    <div className="text-xs uppercase text-slate-500">NKD šifra</div>
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
                            <span className="text-slate-500"> ({a["kratko_zašto"]})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-slate-500">
          Radi isključivo na temelju službenih NKD/KPD 2025 dokumenata učitanih u agenta. ✦ Izradio: MIAI - info@kpdinfo.com
        </p>
      </main>
    </div>
  );
}
