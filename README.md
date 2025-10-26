# KPD info — KPD AI Tražilica (Vite + React + TS)

## 🚀 Pokretanje
```bash
npm i
cp .env.example .env   # po želji promijeni VITE_API_URL
npm run dev
```

Otvorite http://localhost:5173

Aplikacija očekuje backend endpoint `POST /api/kpdinfo/classify` koji prima `{ input_as_text }` i vraća JSON (NKD_4, KPD_6, Naziv_proizvoda, Razlog_odabira, Poruka, alternativne). Ako backend nije dostupan, UI koristi demo fallback.

## 🧩 Napomene
- UI je lagani Tailwind sloj (Button/Card/Badge/Input/Textarea).
- Dark mode toggle + localStorage.
- Regex validacija: NKD_4 -> `^\d{2}\.\d{2}(\.\d)?$`, KPD_6 -> `^\d{2}\.\d{2}\.\d{2}$`.

## 📦 Build
```bash
npm run build
npm run preview
```
