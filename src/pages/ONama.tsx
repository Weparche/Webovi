import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import miai from "../assets/miai-hero.webp";
import miai1 from "../assets/miai-headline.webp";
import miai2 from "../assets/miai-ikone-red.webp";
import miai3 from "../assets/miai-roi.webp";
import miai4 from "../assets/miai-ai-integrations.webp";
export default function ONama() {
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

  useEffect(() => {
    const saved = localStorage.getItem("kpd_theme");
    const pref = saved ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setDark(pref === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kpd_theme", dark ? "dark" : "light");
  }, [dark]);

  // ——— Kontakt (mailto) ———
  function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // honeypot (ako je popunjen, prekid)
    if ((fd.get("website") as string)?.trim()) return;

    const name = (fd.get("name") as string)?.trim() || "Nepoznato";
    const email = (fd.get("email") as string)?.trim() || "Nije navedeno";
    const company = (fd.get("company") as string)?.trim();
    const message = (fd.get("message") as string)?.trim() || "";
    const consent = fd.get("consent") === "on";

    // osnovna validacija
    if (!message) {
      alert("Molimo upišite poruku.");
      return;
    }

    if (!consent) {
      alert("Molimo označite privolu za kontakt.");
      return;
    }

    const subject = `MIAI — upit (${name}${company ? ", " + company : ""})`;
    const bodyLines = [
      `Ime i prezime: ${name}`,
      `E-mail: ${email}`,
      company ? `Tvrtka: ${company}` : null,
      "",
      "Poruka:",
      message,
    ].filter(Boolean);

    const mailto = `mailto:info@miai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailto;
  }


  return (
    <div className="min-h-screen">
      <Header dark={dark} setDark={setDark} />

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        {/* HERO s pozadinskom ilustracijom */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <img
            src={miai}            // (neurons + skyline, “Mi smo AI…”)
            alt="MIAI — tim za pametnu automatizaciju"
            loading="eager"
            className="w-full h-70 sm:h-86 object-cover object-center opacity-95 dark:opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/10 to-transparent dark:from-slate-950/70" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">MIAI</h1>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              Vjera tehnološku u budućnost!
            </p>
          </div>
        </section>

        {/* Naslov odmah nakon hero-a */}
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">O nama</h1>
        </header>

        {/* HEADLINE slika preko cijele širine + tekst ispod slike */}
        <section className="space-y-4">
          <img
            src={miai1}
            alt="AI kompetencije i učinci — headline"
            loading="lazy"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800"
          />
          {/* <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-200">
            Uz najnovije mogućnosti umjetne inteligencije (AI), ovaj učinak postaje još
            izraženiji: spajamo domensko znanje, podatke i alate kako bismo vaše procese
            učinili <strong>bržima, sigurnijima i isplativijima</strong>.
          </p> */}
        </section>

        {/* Što dobivate / Zašto MIAI */}
        {/* <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Što dobivate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 dark:text-slate-300">
              <ul className="list-disc pl-5 space-y-2">
                <li>Besplatan, brzi uvid u vaše poslovanje i ključne procese.</li>
                <li>Mapiranje prilika za automatizaciju (operativa, prodaja, IT, podrška).</li>
                <li>Prijedlog rješenja koja štede vrijeme i novac, s jasnim ROI-em.</li>
                <li>Po potrebi: implementacija AI agenata i integracija s postojećim sustavima.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Zašto MIAI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 dark:text-slate-300">
              <ul className="list-disc pl-5 space-y-2">
                <li>15+ godina iskustva s korporativnim timovima i kritičnim procesima.</li>
                <li>Stotine uspješno automatiziranih tokova rada.</li>
                <li>Praktična AI rješenja koja se isplate, bez “laboratorijskog” viška.</li>
                <li>Transparentan rad: pilot → mjerenje → širenje na organizaciju.</li>
              </ul>
            </CardContent>
          </Card>
        </section> */}

        {/* PLAN PROCESA */}
        <section className="space-y-4">
          <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight">Plan procesa</h2>

          {/* Proces (smanjeno ~30%) + ROI u istoj ravnini */}
          <div className="grid gap-6 md:grid-cols-3 md:items-center space-y-6">
            {/* Lijevo: procesna slika umanjena na 70% širine kolone, centrirana */}
            <div className="md:col-span-2">
              <div className="w-full">
                <img
                  src={miai2}
                  alt="Proces suradnje: pilot, mjerenje, širenje"
                  loading="lazy"
                  className="w-full sm:w-[93%] mx-auto rounded-xl border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Desno: ROI kartica — poravnata u istoj ravnini s procesnom sekcijom */}
            <Card className="md:col-span-1 self-center">
              <CardHeader className="pb-2">
                <CardTitle>Jasan ROI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={miai3}
                  alt="Rast ROI-a kroz automatizaciju"
                  loading="lazy"
                  className="w-full max-w-xs mx-auto"
                />
                <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                  Mjerimo učinke i jasno komuniciramo povrat ulaganja prije širenja.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Integracije AI agenata + završna poruka (ostavljeno kao prije) */}
        <section className="grid gap-8 md:grid-cols-5 items-center">
          <div className="md:col-span-2">
            <img
              src={miai4}
              alt="AI agenti povezani na e-mail, tablice, ERP i CRM"
              loading="lazy"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800"
            />
          </div>
          <Card className="md:col-span-3">
            <CardContent className="pt-6">
              <p className="text-lg">
                <strong>Mi smo AI – MIAI</strong> — stručnjaci za AI automatizacije.
                Povjerite nam svoje izazove; pretvaramo ih u mjerljive rezultate i
                dižemo vaše poslovanje na <strong>novu razinu</strong>.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ——— Kontakt forma (mailto: info@miai.com) ——— */}
        <section id="kontakt" className="scroll-mt-24 space-y-6">
  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">Kontaktirajte nas</h2>
  <Card>
    <CardContent className="pt-6">
      <form onSubmit={handleContactSubmit} className="grid gap-4">
        {/* honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">Ime i prezime</label>
            <input id="name" name="name" required className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Vaše ime" />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">E-mail</label>
            <input id="email" name="email" type="email" required className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="ime@domena.hr" />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="company" className="text-sm font-medium">Tvrtka (neobavezno)</label>
          <input id="company" name="company" className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Naziv tvrtke" />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="message" className="text-sm font-medium">Poruka</label>
          <textarea id="message" name="message" required rows={6} className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kako vam možemo pomoći?" />
        </div>

        <label className="inline-flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" className="mt-1" />
          <span>Slažem se da me MIAI kontaktira povodom mog upita na e-mail adresu koju sam naveo/la.</span>
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit">Pošalji upit</Button>
          <a href="mailto:info@miai.com" className="text-sm text-blue-700 dark:text-blue-400 underline">
            ili pošalji izravno na info@miai.com
          </a>
        </div>
      </form>
    </CardContent>
  </Card>
</section>
        {/* CTA */}
        <div className="text-center">
          <a href="/" className="inline-block">
            <Button>Vrati se na KPD info DEMO</Button>
          </a>
        </div>
      </main>
    </div>
  );
}
