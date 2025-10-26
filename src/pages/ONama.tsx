import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">O nama — MIAI</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Mi smo AI — tim za pametnu automatizaciju i temeljitu operativnu sustavnost.
          </p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed">
              MIAI je novoosnovana firma mladih poduzetnika koja je proizašla iz
              višegodišnjeg rada na projektima velikih hrvatskih kompanija. Tijekom
              posljednjih <strong>15+ godina</strong> naš je tim automatizirao
              <strong> stotine poslovnih procesa</strong> i mjerljivo ubrzao rad – od
              svakodnevnih operaterskih zadataka do složenih programerskih upita.
            </p>
            <p className="mt-4 text-lg leading-relaxed">
              Uz najnovije mogućnosti umjetne inteligencije (AI), ovaj učinak postaje još izraženiji:
              spajamo domensko znanje, podatke i alate kako bismo vaše procese učinili
              <strong> bržima, sigurnijima i isplativijima</strong>.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
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
            <CardHeader>
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
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed">
              <strong>Mi smo AI - MIAI</strong> — stručnjaci za AI automatizacije.
              Povjerite nam svoje izazove; pretvaramo ih u mjerljive rezultate i
              dižemo vaše poslovanje na <strong>novu razinu</strong>.
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <a href="/" className="inline-block">
            <Button>Vrati se na KPD info DEMO</Button>
          </a>
        </div>
      </main>
    </div>
  );
}
