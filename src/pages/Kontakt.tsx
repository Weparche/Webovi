// src/pages/Kontakt.tsx
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Kontakt() {
  // — tema identično kao u ONama.tsx —
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

  // — kontakt mailto submit —
  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // honeypot
    if ((data.get("website") as string)?.trim()) return;

    const name = (data.get("name") as string) || "";
    const email = (data.get("email") as string) || "";
    const company = (data.get("company") as string) || "";
    const message = (data.get("message") as string) || "";
    const consent = data.get("consent") === "on";

    if (!message) {
      alert("Molimo upišite poruku.");
      return;
    }
    if (!consent) {
      alert("Molimo označite privolu za kontakt.");
      return;
    }

    const subject = encodeURIComponent(`Upit s weba — ${name || "N.N."}`);
    const body = encodeURIComponent(
      `Ime i prezime: ${name}\nE-mail: ${email}\nTvrtka: ${company}\n\nPoruka:\n${message}`
    );
    window.location.href = `mailto:info@kpdinfo.com?subject=${subject}&body=${body}`;
    form.reset();
  }

  return (
    <div className="min-h-screen">
      {/* Header uvijek vidljiv — isti princip kao ONama.tsx */}
      <Header dark={dark} setDark={setDark} />

      {/* Top padding da sadržaj ne upadne ispod fixed headera */}
      <main className="pt-16 sm:pt-20 mx-auto max-w-3xl px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-center">Kontaktirajte nas</h1>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleContactSubmit} className="grid gap-4">
              {/* honeypot */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor="name" className="text-sm font-medium">Ime i prezime</label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Vaše ime"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ime@domena.hr"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="company" className="text-sm font-medium">Tvrtka (neobavezno)</label>
                <input
                  id="company"
                  name="company"
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Naziv tvrtke"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="message" className="text-sm font-medium">Poruka</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kako vam možemo pomoći?"
                />
              </div>

              <label className="inline-flex items-start gap-3 text-sm">
                <input type="checkbox" name="consent" className="mt-1" required />
                <span>Slažem se da me MIAI kontaktira povodom mog upita na e-mail adresu koju sam naveo/la.</span>
              </label>

              <div className="flex items-center gap-3">
                <Button type="submit">Pošalji upit</Button>
                <a href="mailto:info@kpdinfo.com" className="text-sm text-blue-700 dark:text-blue-400 underline">
                  ili pošalji izravno na info@kpdinfo.com
                </a>
              </div>

              {/* Info napomena – centrirano, manji font (kao što si tražio) */}
              <div className="mt-2 min-h-10 flex items-center justify-center text-center">
                <p className="text-xs sm:text-sm text-slate-600">
                  Za sve službene upite obratite se na adresu Državnog zavoda za statistiku —{" "}
                  <a href="mailto:klasifikacija@dzs.hr" className="underline underline-offset-2">
                    klasifikacija@dzs.hr
                  </a>.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

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
