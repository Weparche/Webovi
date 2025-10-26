// functions/_edge/agent-core.ts

/** ----------------------------- Types ----------------------------- */

export type KpdResponse = {
  NKD_4: string | null;
  NKD_naziv: string | null;
  KPD_6: string | null;
  Naziv_proizvoda: string | null;
  Razlog_odabira: string | null;
  Poruka: string | null;
  alternativne: Array<{ KPD_6: string | null; Naziv: string; ["kratko_zašto"]: string | null }>;
};

export type AgentEnv = {
  OPENAI_API_KEY?: string;
  VS_NKD_ID?: string;
  VS_KPD_ID?: string;
};

/** ----------------------------- Utils ----------------------------- */

function coerceKpdResponse(obj: any): KpdResponse {
  const arr = Array.isArray(obj?.alternativne) ? obj.alternativne : [];
  return {
    NKD_4: obj?.NKD_4 ?? null,
    NKD_naziv: obj?.NKD_naziv ?? null,
    KPD_6: obj?.KPD_6 ?? null,
    Naziv_proizvoda: obj?.Naziv_proizvoda ?? null,
    Razlog_odabira: obj?.Razlog_odabira ?? null,
    Poruka: obj?.Poruka ?? null,
    alternativne: arr.map((a: any) => ({
      KPD_6: a?.KPD_6 ?? null,
      Naziv: a?.Naziv ?? "",
      ["kratko_zašto"]: (a?.["kratko_zašto"] ?? a?.kratko_zasto ?? null) as string | null,
    })),
  };
}

/**
 * Parsira odgovor Responses API-ja:
 * - preferira `output_parsed`
 * - zatim traži `message.parsed` ili `content[*]` JSON
 * - fallback: pokuša parseati tekstualni JSON
 */
function extractParsed(data: any): any | null {
  // 1) Najčišće
  if (data?.output_parsed) return data.output_parsed;

  // 2) Unutar output[] poruka
  const out = Array.isArray(data?.output) ? data.output : [];
  for (const item of out) {
    // a) message.parsed
    if (item?.parsed) return item.parsed;

    // b) content[*] s json-om
    const content = Array.isArray(item?.content) ? item.content : [];
    const jsonObj =
      content.find((c: any) => c?.type === "output_json" && c?.json)?.json ??
      content.find((c: any) => c?.type === "json" && c?.json)?.json;
    if (jsonObj && typeof jsonObj === "object") return jsonObj;

    // c) content[*] tekst (ako se netko igra bez json_schema)
    const textChunk =
      content.find((c: any) => typeof c?.text === "string")?.text ??
      content.find((c: any) => c?.type === "output_text" && typeof c?.text === "string")?.text;
    if (typeof textChunk === "string") {
      const s = textChunk.trim();
      if (s.startsWith("{") || s.startsWith("[")) {
        try {
          return JSON.parse(s);
        } catch {
          /* ignore */
        }
      }
    }
  }

  // 3) Krajnji fallback — pogledaj root polja
  const maybeText = typeof data?.output_text === "string" ? data.output_text.trim() : "";
  if (maybeText && (maybeText.startsWith("{") || maybeText.startsWith("["))) {
    try {
      return JSON.parse(maybeText);
    } catch {
      /* ignore */
    }
  }

  return null;
}

async function callOpenAI(payload: any, apiKey: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 80_000);

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`OpenAI HTTP ${res.status}: ${text || res.statusText}`);
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`OpenAI JSON parse fail: ${text.slice(0, 300)}`);
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}

/** ----------------------------- Prompt & JSON Schema ----------------------------- */

const SYSTEM_PROMPT = `🧠 KPD frik v6 — službene upute (Production Mode)
🎯 Svrha
Tvoj zadatak je klasifikacija djelatnosti, proizvoda i usluga u skladu s:
NKD 2025 – Nacionalna klasifikacija djelatnosti Republike Hrvatske
KPD 2025 – Klasifikacija proizvoda po djelatnostima Republike Hrvatske
Koristi isključivo službene dokumente koji su učitani u tvoju bazu (retrieval):
NKD_2025_struktura_i_objasnjenja.pdf
KPD_2025_struktura.json
Ne koristi nikakve druge izvore niti znanje izvan tih dokumenata.
🔧 Postupak
1️⃣ Odredi NKD kod
Analiziraj korisnikov opis (npr. “prodaja stolica u salonu”, “izrada web stranice”, “ugradnja klima uređaja”).
Pretraži NKD_2025_struktura_i_objasnjenja.pdf i pronađi najrelevantniji podrazred formata dd.dd ili dd.dd.d.
U objašnjenju koristi izvorne izraze iz dokumenta i napiši 1–2 rečenice zašto je taj kod odabran.
2️⃣ Odredi KPD kod
Otvori KPD_2025_struktura.json.
Filtriraj redove koji počinju s istim prefiksom kao NKD (prve 4 znamenke).
KPD mora imati šest znamenki (dd.dd.dd).
Kombiniraj prve četiri znamenke NKD + zadnje dvije iz stvarnog KPD zapisa.
Primjer:
NKD 47.55 → KPD 47.55.01 (šifra mora stvarno postojati u JSON dokumentu)
Ako šifra ne postoji, postavi "KPD_6": null i "Poruka" s objašnjenjem.
U tom slučaju obavezno navedi najmanje dvije srodne šifre iz istog prefiksa.
3️⃣ Validacija i format
Prije nego vratiš odgovor:
Provjeri da "KPD_6" postoji u KPD_2025_struktura.json.
Ako ne postoji, vrati:
"KPD_6": null, "Poruka": "Šifra nije pronađena u KPD 2025 bazi.", "alternativne": [ ... ] 
Regex validacija:
"NKD_4" → ^\d{2}\.\d{2}(\.\d)?$
"KPD_6" → ^\d{2}\.\d{2}\.\d{2}$
Vrati točno jedan JSON objekt (nikada više njih).
U “strict” režimu svi parametri moraju biti prisutni (ako ih nema, koristi null).
⚙️ Format odgovora
Uvijek vrati JSON prema ovoj strukturi:
{   "NKD_4": "dd.dd",   "KPD_6": "dd.dd.dd",   "Naziv_proizvoda": "točan naziv iz KPD tablice",   "Razlog_odabira": "1–3 rečenice objašnjenja na temelju dokumenata",   "Poruka": null,   "alternativne": [     {       "KPD_6": "xx.xx.xx",       "Naziv": "...",       "kratko_zašto": "kratko objašnjenje"     }   ] } 
Ako šifra ne postoji:
{   "NKD_4": "dd.dd.d",   "KPD_6": null,   "Naziv_proizvoda": null,   "Razlog_odabira": "opis objašnjenja NKD podrazreda",   "Poruka": "Za ovaj NKD ne postoji točna KPD šifra u službenom dokumentu. Predložene su srodne šifre iz istog područja.",   "alternativne": [     {       "KPD_6": "xx.xx.xx",       "Naziv": "...",       "kratko_zašto": "..."     },     {       "KPD_6": "yy.yy.yy",       "Naziv": "...",       "kratko_zašto": "..."     }   ] } 

4. Odredi alternativne šifre
Nakon što pronađeš točnu KPD šifru ("KPD_6") u dokumentu KPD_2025_struktura.json, moraš uvijek provjeriti postoji li još 1–3 srodne šifre u istom prefiksu (iste prve 4 znamenke). U odjeljak "alternativne" obavezno dodaj do tri stvarne šifre koje postoje u dokumentu, ako imaju sličan opis ili značenje.
Pravila za izbor alternativnih:
sve alternative moraju postojati u dokumentu KPD_2025_struktura.json
moraju imati isti prefiks (prve četiri znamenke, npr. 47.55)
odaberi šifre koje imaju različit, ali blizak naziv (npr. .02, .09, .99)
nikad ne koristi iste šifre koje si već dao u "KPD_6"
uvijek ih vrati u formatu:
"alternativne": [   {     "KPD_6": "xx.xx.xx",     "Naziv": "točan naziv iz dokumenta",     "kratko_zašto": "kratko objašnjenje zašto bi mogla biti relevantna"   } ]

5. Kombinirane djelatnosti (prodaja + ugradnja / usluga + proizvod)
Ako korisnički upit uključuje dvije različite radnje (npr. “prodaja i ugradnja”, “proizvodnja i montaža”, “usluga i prodaja”), obavezno pronađi dvije različite NKD i KPD domene:
Prva domena: prema usluzi / radovima (npr. 43.22.12 – ugradnja klima uređaja)
Druga domena: prema trgovini / prodaji (npr. 47.54.00 – prodaja električnih aparata za kućanstvo)
U takvim slučajevima:
"KPD_6" vraća glavnu šifru za dominantnu djelatnost (npr. ugradnju)
"alternativne" mora sadržavati barem jednu stvarnu šifru iz druge domene (npr. 47.xx.xx)
sve šifre moraju postojati u KPD_2025_struktura.json
"kratko_zašto" mora jasno opisati kontekst (npr. “ako se radi samo o prodaji uređaja bez montaže”)
🚫 Zabranjeno
Izmišljati šifre koje nisu u dokumentima.
Koristiti starije klasifikacije (NKD 2007, CPA 2008).
Vraćati više JSON-ova u istom odgovoru.
Uključivati objašnjenja izvan JSON formata (npr. tekst, markdown, komentare).
✅ Podsjetnik
Ti si službeni KPD/NKD klasifikator. Uvijek moraš:
fizički provjeriti šifre u dokumentima,
vratiti točan JSON po shemi,
osigurati da svako polje postoji (ako nema vrijednosti → null),
i ne generirati nikakve dodatne podatke izvan strukture.`;

const JSON_SCHEMA: Record<string, any> = {
  type: "object",
  additionalProperties: false,
  properties: {
    NKD_4: { type: ["string", "null"] },
    NKD_naziv: { type: ["string", "null"] },
    KPD_6: { type: ["string", "null"] },
    Naziv_proizvoda: { type: ["string", "null"] },
    Razlog_odabira: { type: ["string", "null"] },
    Poruka: { type: ["string", "null"] },
    alternativne: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          KPD_6: { type: ["string", "null"] },
          Naziv: { type: "string" },
          ["kratko_zašto"]: { type: ["string", "null"] },
        },
        required: ["KPD_6", "Naziv", "kratko_zašto"],
      },
    },
  },
  required: [
    "NKD_4",
    "NKD_naziv",
    "KPD_6",
    "Naziv_proizvoda",
    "Razlog_odabira",
    "Poruka",
    "alternativne",
  ],
};

/** ----------------------------- Payload builder ----------------------------- */

function buildPayload(input_as_text: string, vectorIds: string[] | null) {
  const payload: any = {
    model: "gpt-5", // ili točan dated: "gpt-5-2025-08-07" ako želiš fiksirati
    input: [
      { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
      { role: "user", content: [{ type: "input_text", text: input_as_text }] },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "KpdResponse",
        schema: JSON_SCHEMA,
        strict: true,
      },
    },
    reasoning: { effort: "low" },
    
  };

  if (vectorIds && vectorIds.length) {
    payload.tools = [{ type: "file_search" }];
    payload.tool_resources = { file_search: { vector_store_ids: vectorIds } };
  }

  return payload;
}

/** ----------------------------- Main entry ----------------------------- */

export async function classifyCore(input_as_text: string, env?: AgentEnv): Promise<KpdResponse> {
  const apiKey = env?.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY nije postavljen u Cloudflare Pages > Settings > Environment Variables (Production)."
    );
  }

  const vectorIds = [env?.VS_NKD_ID, env?.VS_KPD_ID].filter(Boolean) as string[];

  try {
    // 1) Pokušaj S file_search (ako postoje ID-evi)
    const data = await callOpenAI(buildPayload(input_as_text, vectorIds.length ? vectorIds : null), apiKey);
    const parsed = extractParsed(data);
    if (!parsed) {
      throw new Error(
        `OpenAI ne vraća parsabilan JSON. Sample: ${JSON.stringify(
          { output: data?.output?.slice?.(0, 1), output_text: data?.output_text ?? null },
          null,
          2
        )}`
      );
    }
    return coerceKpdResponse(parsed);
  } catch (e: any) {
    const msg = String(e?.message || e);

    // Ako greška izgleda kao problem s vektorima/alatom, probaj BEZ alata
    const looksLikeVS =
      msg.includes("vector_store") ||
      msg.includes("file_search") ||
      msg.includes("tool_resources") ||
      msg.includes("vector") ||
      msg.includes("store");

    if (!looksLikeVS) throw e;

    const dataNoTools = await callOpenAI(buildPayload(input_as_text, null), apiKey);
    const parsedNoTools = extractParsed(dataNoTools);
    if (!parsedNoTools) {
      throw new Error(
        `OpenAI ne vraća parsabilan JSON (bez file_search). Sample: ${JSON.stringify(
          { output: dataNoTools?.output?.slice?.(0, 1), output_text: dataNoTools?.output_text ?? null },
          null,
          2
        )}`
      );
    }
    return coerceKpdResponse(parsedNoTools);
  }
}
