import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import miai from "../miai/logo.png";

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
              Mi smo AI — tim za pametnu automatizaciju i temeljitu operativnu sustavnost.
            </p>
          </div>
        </section>

        {/* Naslov odmah nakon hero-a */}
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Više o nama</h1>
        </header>

        {/* HEADLINE slika preko cijele širine + tekst ispod slike */}
        <section className="space-y-4">
          <img
            src="/miai/miai-headline.png"
            alt="AI kompetencije i učinci — headline"
            loading="lazy"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800"
          />
          <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-200">
            Uz najnovije mogućnosti umjetne inteligencije (AI), ovaj učinak postaje još
            izraženiji: spajamo domensko znanje, podatke i alate kako bismo vaše procese
            učinili <strong>bržima, sigurnijima i isplativijima</strong>.
          </p>
        </section>

        {/* Što dobivate / Zašto MIAI */}
        <section className="grid gap-6 md:grid-cols-2">
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
        </section>

        {/* PLAN PROCESA */}
        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Plan procesa</h2>

          {/* Proces (smanjeno ~30%) + ROI u istoj ravnini */}
          <div className="grid gap-6 md:grid-cols-3 md:items-center">
            {/* Lijevo: procesna slika umanjena na 70% širine kolone, centrirana */}
            <div className="md:col-span-2">
              <div className="w-full">
                <img
                  src="/miai/miai-proces-pilot-mjerenje-sirenje.png"
                  alt="Proces suradnje: pilot, mjerenje, širenje"
                  loading="lazy"
                  className="w-full sm:w-[70%] mx-auto rounded-xl border border-slate-200 dark:border-slate-800"
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
                  src="/miai/miai-roi.png"
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
              src="/miai/miai-ai-integrations.png"
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
