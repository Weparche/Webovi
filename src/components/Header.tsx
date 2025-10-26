import React from "react";
import { Button } from "@/components/ui/Button";
import { Moon, SunMedium, Sparkles, Home } from "lucide-react";

type HeaderProps = {
  dark: boolean;
  setDark: (v: boolean) => void;
};

export default function Header({ dark, setDark }: HeaderProps) {
  // zajedničke klase da svi linkovi budu iste veličine
  const navBtn =
    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800";

  return (
    <header className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/60 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        {/* Lijevo: logo + naziv (logo vodi na početnu) */}
        <div className="flex items-center gap-2 min-w-0">
          <a href="/" title="Početna" className="shrink-0">
            <img
              src="../assets/logo.png"
              alt="KPD info logo"
              className="h-13 w-13 md:h-13 md:w-13 rounded-lg object-contain bg-white/70 dark:bg-slate-800/60 p-0.5 shadow-sm"
            />
          </a>
          <div className="truncate">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight text-blue-600">KPD info DEMO</h1>
            <p className="text-[11px] sm:text-xl text-slate-500 -mt-0.5 leading-none text-green-400">KPD AI Tražilica</p>
          </div>
        </div>

        {/* Sredina: Partner + Powered by */}
<div className="hidden sm:flex flex-col justify-center items-center gap-1">
  <span className="text-[11px] sm:text-xl font-bold text-blue-600 tracking-wide">
    Vaš Partner za <span className="whitespace-nowrap">Fiskalizaciju 2.0</span>
  </span>

  <div className="flex items-center gap-2">
    <span className="text-xs font-semibold bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 bg-clip-text text-transparent leading-none">
      Powered by Chat GPT-5
    </span>
    <img
      src="./chatgpt.png"
      alt="ChatGPT"
      className="h-4 w-auto md:h-5 select-none"
      draggable="false"
    />
  </div>
</div>

        {/* Desno: navigacija (sve iste veličine) */}
        <nav className="flex items-center gap-2 justify-self-end">
          <a href="/" className={navBtn} title="Početna">
            <Home className="h-4 w-4" />
            <span>Početna</span>
          </a>

          <a href="/#primjeri" className={navBtn} title="Primjeri upita">
            <Sparkles className="h-4 w-4" />
            <span>Primjeri</span>
          </a>

          <a href="/o-nama" className={navBtn} title="O nama">
            <Sparkles className="h-4 w-4" />
            <span>O nama</span>
          </a>

          
          <Button
            variant="outline"
            onClick={() => setDark(!dark)}
            aria-pressed={dark}
            title="Tema: svijetla/tamna"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm"
          >
            {dark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>Tema</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
