import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Moon, SunMedium, Sparkles, Home, Menu, X,LayoutGrid, Users2, Mail } from "lucide-react";
import logoUrl from "../assets/logo.png";
import chatgptUrl from "../assets/chatgpt.png";

type HeaderProps = {
  dark: boolean;
  setDark: (v: boolean) => void;
};

export default function Header({ dark, setDark }: HeaderProps) {
  const [open, setOpen] = useState(false);

  // zajedničke klase linkova (desktop)
  const navBtn =
    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800";

  // mobilni stil linkova (veći tap targets)
  const mobileLink =
    "flex items-center gap-2 rounded-lg border px-4 py-3 text-base hover:bg-slate-50 dark:hover:bg-slate-800";

  return (
    <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/60 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      {/* Gornja traka */}
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2.5 sm:py-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        {/* Lijevo: logo + naziv (logo vodi na početnu) */}
        <div className="flex items-center gap-2 min-w-0">
          <a href="/" title="Početna" className="shrink-0">
            <img
              src={logoUrl}
              alt="KPD info logo"
              className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg object-contain bg-white/70 dark:bg-slate-800/60 p-0.5 shadow-sm"
            />
          </a>
          <div className="truncate leading-tight">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-blue-600">
              KPD info DEMO
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-green-500 -mt-0.5">
              KPD AI Tražilica
            </p>
          </div>
        </div>

        {/* Sredina: Powered by (skriven na xs) */}
        <div className="hidden sm:flex flex-col justify-center items-center gap-1">
          <span className="text-[11px] sm:text-sm font-semibold text-blue-600 tracking-wide">
            Vaš Partner za <span className="whitespace-nowrap">Fiskalizaciju 2.0</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 bg-clip-text text-transparent leading-none">
              Powered by Chat GPT-5
            </span>
            <img
              src={chatgptUrl}
              alt="ChatGPT"
              className="h-4 w-auto md:h-5 select-none"
              draggable="false"
            />
          </div>
        </div>

        {/* Desno: desktop navigacija + tema + hamburger */}
        <div className="flex items-center gap-2 justify-self-end">
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <a href="/" className={navBtn} title="Početna">
              <Home className="h-4 w-4" />
              <span>Početna</span>
            </a>
            <a href="/primjeri" className={navBtn} title="Primjeri upita">
              <LayoutGrid className="h-4 w-4" />
              <span>Primjeri</span>
            </a>
            <a href="/o-nama" className={navBtn} title="O nama">
              <Users2 className="h-4 w-4" />
              <span>O nama</span>
            </a>          
          <a href="/kontakt" className={navBtn} title="kontakt">
              <Mail className="h-4 w-4" />
              <span>Kontakt</span>
            </a>
          </nav>

          {/* Gumb za temu (uvijek vidljiv) */}
          <Button
            variant="outline"
            onClick={() => setDark(!dark)}
            aria-pressed={dark}
            title="Tema: svijetla/tamna"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm"
          >
            {dark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">Tema</span>
          </Button>

          {/* Hamburger (samo mobile/tablet) */}
          <Button
            variant="outline"
            className="md:hidden inline-flex items-center gap-2 px-3 py-2"
            aria-label="Otvori izbornik"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobilni izbornik (slide-down) */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-3 sm:px-4 pb-3 flex flex-col gap-2">
          <a href="/" className={mobileLink} onClick={() => setOpen(false)}>
            <Home className="h-5 w-5" />
            <span>Početna</span>
          </a>
          <a href="/primjeri" className={mobileLink} onClick={() => setOpen(false)}>
            <LayoutGrid className="h-5 w-5" />
            <span>Primjeri</span>
          </a>
          <a href="/o-nama" className={mobileLink} onClick={() => setOpen(false)}>
            <Users2 className="h-5 w-5" />
            <span>O nama</span>
          </a>
          <a href="/kontakt" className={mobileLink} onClick={() => setOpen(false)}>
            <Mail className="h-5 w-5" />
            <span>Kontakt</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
