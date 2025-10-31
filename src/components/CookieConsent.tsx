// src/components/CookieConsent.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const LS_KEY = "cookie_consent_v1"; // change version when you update policy

type ConsentState = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as ConsentState | null;
    if (!saved) setVisible(true);
  }, []);

  function acceptAll() {
    localStorage.setItem(LS_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);

    // (opcija) GTM/analytics init tek nakon pristanka:
    // window.dataLayer = window.dataLayer || [];
    // window.dataLayer.push({ event: "cookie_consent", consent: "accepted" });
  }

  function rejectAll() {
    localStorage.setItem(LS_KEY, "rejected");
    setConsent("rejected");
    setVisible(false);

    // window.dataLayer = window.dataLayer || [];
    // window.dataLayer.push({ event: "cookie_consent", consent: "rejected" });
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-lg"
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700 dark:text-slate-200">
          Koristimo kolačiće za osnovne funkcije i unapređenje iskustva. Čitanjem i prihvaćanjem
          slažeš se s našom&nbsp;
          <a href="/cookie-politika" className="underline underline-offset-2">
            Politikom kolačića
          </a>
          .
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={rejectAll}>
            Odbij
          </Button>
          <Button onClick={acceptAll}>
            Prihvati sve
          </Button>
        </div>
      </div>
    </div>
  );
}
