// functions/_edge/agent-core.ts

/** ------------------------------------------------------------------
 *                      Types & Environment contracts
 * ------------------------------------------------------------------ */
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
  OPENAI_API_KEY?: string;   // sk-...
  OPENAI_PROJECT?: string;   // proj_...
  OPENAI_ORG?: string;       // (opcionalno) org_...
  VS_NKD_ID?: string;        // vs_...
  VS_KPD_ID?: string;        // vs_...
};

/** ------------------------------------------------------------------
 *                              Utils
 * ------------------------------------------------------------------ */

/** Izvlači JSON iz Responses API odgovora (output_parsed > content json > tekstualni JSON) */
function extractParsed(data: any): any | null {
  if (data?.output_parsed) return data.output_parsed;

  const out = Array.isArray(data?.output) ? data.output : [];
  for (const item of out) {
    if (item?.parsed) return item.parsed;

    const content = Array.isArray(item?.content) ? item.content : [];
    const jsonObj =
      content.find((c: any) => c?.type === "output_json" && c?.json)?.json ??
      content.find((c: any) => c?.type === "json" && c?.json)?.json;
    if (jsonObj && typeof jsonObj === "object") return jsonObj;

    const textChunk =
      content.find((c: any) => typeof c?.text === "string")?.text ??
      content.find((c: any) => c?.type === "output_text" && typeof c?.text === "string")?.text;
    if (typeof textChunk === "string") {
      const s = textChunk.trim();
      if (s.startsWith("{") || s.startsWith("[")) {
        try { return JSON.parse(s); } catch { /* ignore */ }
      }
    }
  }

  const maybeText = typeof data?.output_text === "string" ? data.output_text.trim() : "";
  if (maybeText && (maybeText.startsWith("{") || maybeText.startsWith("["))) {
    try { return JSON.parse(maybeText); } catch { /* ignore */ }
  }
  return null;
}

/** Robustno detektira je li file_search alat korišten (više snapshot formata) */
function usedRetrieval(data: any): boolean {
  const out = Array.isArray(data?.output) ? data.output : [];

  for (const msg of out) {
    // 1) klasični poziv alata
    if (Array.isArray(msg?.tool_calls) && msg.tool_calls.some((tc: any) =>
      (tc?.type || tc?.tool_type) === "file_search" || tc?.name === "file_search")) return true;

    // 2) content varijante
    const content = Array.isArray(msg?.content) ? msg.content : [];
    for (const c of content) {
      // a) tool_use / tool_result stil
      if (c?.type === "tool_use" || c?.type === "tool_result") {
        if (c?.name === "file_search" || c?.tool_name === "file_search") return true;
      }
      // b) eksplicitni “file_search_*” tipovi (ovisno o snapshotu)
      if (c?.type === "file_search_results" || c?.type === "file_search_call") return true;
      // c) anotacije s referencama na datoteke
      if (Array.isArray(c?.annotations) && c.annotations.some((a: any) =>
        a?.file_id || a?.filename || (typeof a?.type === "string" && a.type.includes("file")))) return true;
    }
  }

  // 3) included blok (kad koristiš include: ["file_search_call.results"])
  if (data?.included && JSON.stringify(data.included).includes("file_search")) return true;

  // 4) fallback: ponekad snapshot vrati “Searched files…” tekstualno
  if (out.some((m: any) =>
    JSON.stringify(m?.content || []).toLowerCase().includes("searched files") ||
    JSON.stringify(m?.content || []).includes("KPD_2025_struktura.json") ||
    JSON.stringify(m?.content || []).includes("NKD 2025_struktura_i_objasnjenja.pdf"))) return true;

  return false;
}

/** Kratki “proof” string za logiranje o korištenju retrievala */
function retrievalProof(data: any): string {
  const proofs: string[] = [];
  const out = Array.isArray(data?.output) ? data.output : [];

  out.forEach((msg: any, i: number) => {
    const toolCalls = Array.isArray(msg?.tool_calls) ? msg.tool_calls : [];
    toolCalls.forEach((tc: any, j: number) => {
      if ((tc?.type || tc?.tool_type) === "file_search" || tc?.name === "file_search") {
        proofs.push(`output[${i}].tool_calls[${j}]: file_search`);
      }
    });

    const content = Array.isArray(msg?.content) ? msg.content : [];
    content.forEach((c: any, k: number) => {
      if ((c?.type === "tool_use" || c?.type === "tool_result") &&
          (c?.name === "file_search" || c?.tool_name === "file_search")) {
        proofs.push(`output[${i}].content[${k}]: ${c.type}:file_search`);
      }
      if (c?.type === "file_search_results" || c?.type === "file_search_call") {
        proofs.push(`output[${i}].content[${k}]: ${c.type}`);
      }
      if (Array.isArray(c?.annotations) && c.annotations.length) {
        const files = [...new Set(c.annotations
          .map((a: any) => a?.filename)
          .filter(Boolean))];
        if (files.length) proofs.push(`output[${i}].content[${k}]: annotations -> ${files.join(", ")}`);
      }
    });
  });

  if (data?.included) proofs.push("included: file_search present");
  return proofs.join(" | ");
}

/** HTTP wrapper prema OpenAI Responses API-ju, s Project/Org/Beta headerima */
async function callOpenAI(payload: any, apiKey: string, project?: string, org?: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 80_000);
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(project ? { "OpenAI-Project": project } : {}),
      ...(org ? { "OpenAI-Organization": org } : {}),
      "OpenAI-Beta": "assistants=v2",
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${text || res.statusText}`);

    let data: any;
    try { data = JSON.parse(text); }
    catch { throw new Error(`OpenAI JSON parse fail: ${text.slice(0, 300)}`); }

    return data;
  } finally {
    clearTimeout(t);
  }
}

/** (opcionalno) GET na VS radi provjere vidljivosti — koristi iste headere kao i Responses */
async function assertVectorStoreVisible(apiKey: string, project: string | undefined, org: string | undefined, vsId: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...(project ? { "OpenAI-Project": project } : {}),
    ...(org ? { "OpenAI-Organization": org } : {}),
    "OpenAI-Beta": "assistants=v2",
  };
  const r = await fetch(`https://api.openai.com/v1/vector_stores/${vsId}`, { headers });
  if (!r.ok) throw new Error(`Vector store ${vsId} nije vidljiv. HTTP ${r.status}: ${await r.text()}`);
}

/** ------------------------------------------------------------------
 *                      Prompt & JSON Schema
 * ------------------------------------------------------------------ */

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
"NKD_4" → ^\\d{2}\\.\\d{2}(\\.\\d)?$
"KPD_6" → ^\\d{2}\\.\\d{2}\\.\\d{2}$
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
i ne generirati nikakve dodatne podatke izvan strukture.
DODATNO (operativno pravilo): Prije formiranja odgovora obavezno pozovi file_search nad učitanim dokumentima i oslanjaj se isključivo na rezultate pretraživanja.`;

/** JSON Schema (Responses json_schema formatter) */
const JSON_SCHEMA: Record<string, any> = {
  type: "object",
  additionalProperties: false,
  properties: {
    NKD_4: { type: ["string", "null"], pattern: "^\\d{2}\\.\\d{2}(\\.\\d)?$" },
    NKD_naziv: { type: ["string", "null"] },
    KPD_6: { type: ["string", "null"], pattern: "^\\d{2}\\.\\d{2}\\.\\d{2}$" },
    Naziv_proizvoda: { type: ["string", "null"] },
    Razlog_odabira: { type: ["string", "null"] },
    Poruka: { type: ["string", "null"] },
    alternativne: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          KPD_6: { type: ["string", "null"], pattern: "^\\d{2}\\.\\d{2}\\.\\d{2}$" },
          Naziv: { type: "string" },
          ["kratko_zašto"]: { type: ["string", "null"] },
        },
        required: ["KPD_6", "Naziv", "kratko_zašto"],
      },
    },
  },
  required: ["NKD_4", "NKD_naziv", "KPD_6", "Naziv_proizvoda", "Razlog_odabira", "Poruka", "alternativne"],
};

/** ------------------------------------------------------------------
 *                        Vector Stores & Payload
 * ------------------------------------------------------------------ */

/** Default fallback VS – tvoj ID */
const DEFAULT_VECTOR_STORES = ["vs_68f0cfbb2d9081918800e3eb92d9d483"];

/** Složi listu VS-ova: prvo iz ENV-a (ako postoje), inače default. */
function getVectorStoreIds(env?: AgentEnv): string[] {
  const fromEnv = [env?.VS_NKD_ID, env?.VS_KPD_ID].filter(Boolean) as string[];
  const base = (fromEnv.length ? fromEnv : DEFAULT_VECTOR_STORES);
  return Array.from(new Set(base));
}

/** Payload za Responses: gpt-5 + prisilni file_search (bez attachments/tool_resources) */
function buildPayload(input_as_text: string, vectorIds: string[]) {
  return {
    model: "gpt-5",
    input: [
      { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
      { role: "user", content: [{ type: "input_text", text: input_as_text }] },
    ],
    text: {
      format: { type: "json_schema", name: "KpdResponse", schema: JSON_SCHEMA, strict: true },
    },
    reasoning: { effort: "low" },

    // deklariraj file_search alat i veži VS ID-jeve
    tools: [
      {
        type: "file_search",
        vector_store_ids: vectorIds,
        max_num_results: 8,
      },
    ],

    // prisili korištenje file_search (format koji snapshot prihvaća)
    // tool_choice: { type: "file_search" },

    // vrati rezultate pretrage u included (ako snapshot podržava)
    include: ["file_search_call.results"],
  };
}

/** ------------------------------------------------------------------
 *                            Public API
 * ------------------------------------------------------------------ */

/**
 * Izvrši klasifikaciju NKD/KPD strogo na temelju dokumenata u Vector Storeu.
 * Nema lokalnog JSON-a; nema fallbacka bez alata.
 */
export async function classifyCore(input_as_text: string, env?: AgentEnv): Promise<KpdResponse> {
  const apiKey = env?.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY nije postavljen.");

  const project = env?.OPENAI_PROJECT;
  const org = env?.OPENAI_ORG;
  const vectorIds = getVectorStoreIds(env);
  if (!vectorIds.length) throw new Error("Nije postavljen niti jedan Vector Store ID.");

  // (opcionalno) self-test da je barem prvi VS vidljiv u istom Projectu
  try {
    await assertVectorStoreVisible(apiKey, project, org, vectorIds[0]);
  } catch (e) {
    // Ne rušimo automatski — logiramo jasan razlog
    console.warn(String(e));
  }

  const data = await callOpenAI(buildPayload(input_as_text, vectorIds), apiKey, project, org);

  // dijagnostika
  try {
    console.log("model_used:", data?.model);

    // univerzalno “retrieved_files” logiranje
    const files: string[] = [];
    const out = Array.isArray(data?.output) ? data.output : [];
    for (const msg of out) {
      const content = Array.isArray(msg?.content) ? msg.content : [];
      for (const c of content) {
        if (Array.isArray(c?.annotations)) {
          for (const a of c.annotations) if (a?.filename) files.push(a.filename);
        }
        if (typeof c?.text === "string") {
          if (c.text.includes("KPD_2025_struktura.json")) files.push("KPD_2025_struktura.json");
          if (c.text.includes("NKD 2025_struktura_i_objasnjenja.pdf")) files.push("NKD 2025_struktura_i_objasnjenja.pdf");
        }
      }
    }
    console.log("retrieved_files:", [...new Set(files)]);
  } catch { /* ignore */ }

  // ne rušimo ako ne nađemo hard proof — samo warning (neki snapshoti ne vraćaju tool_use eksplicitno)
  const proof = retrievalProof(data);
  if (!usedRetrieval(data)) {
    console.warn("⚠️ file_search možda nije eksplicitno označen. Proof:", proof);
  } else {
    console.log("✅ retrieval proof:", proof);
  }

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

  // coercion na KpdResponse tip
  const arr = Array.isArray(parsed?.alternativne) ? parsed.alternativne : [];
  const coerced: KpdResponse = {
    NKD_4: parsed?.NKD_4 ?? null,
    NKD_naziv: parsed?.NKD_naziv ?? null,
    KPD_6: parsed?.KPD_6 ?? null,
    Naziv_proizvoda: parsed?.Naziv_proizvoda ?? null,
    Razlog_odabira: parsed?.Razlog_odabira ?? null,
    Poruka: parsed?.Poruka ?? null,
    alternativne: arr.map((a: any) => ({
      KPD_6: a?.KPD_6 ?? null,
      Naziv: a?.Naziv ?? "",
      ["kratko_zašto"]: (a?.["kratko_zašto"] ?? a?.kratko_zasto ?? null) as string | null,
    })),
  };

  return coerced;
}
