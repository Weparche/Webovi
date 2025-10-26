// functions/_edge/agent-core.ts

export type KpdResponse = {
  NKD_4: string | null;
  NKD_naziv: string | null;
  KPD_6: string | null;
  Naziv_proizvoda: string | null;
  Razlog_odabira: string | null;
  Poruka: string | null;
  alternativne: Array<{ KPD_6: string | null; Naziv: string; ["kratko_zašto"]?: string | null }>;
};

export type AgentEnv = {
  OPENAI_API_KEY?: string;
  VS_NKD_ID?: string;
  VS_KPD_ID?: string;
};

// —————————— utili ——————————

function coerceKpdResponse(obj: any): KpdResponse {
  return {
    NKD_4: obj?.NKD_4 ?? null,
    NKD_naziv: obj?.NKD_naziv ?? null,
    KPD_6: obj?.KPD_6 ?? null,
    Naziv_proizvoda: obj?.Naziv_proizvoda ?? null,
    Razlog_odabira: obj?.Razlog_odabira ?? null,
    Poruka: obj?.Poruka ?? null,
    alternativne: Array.isArray(obj?.alternativne)
      ? obj.alternativne.map((a: any) => ({
          KPD_6: a?.KPD_6 ?? null,
          Naziv: a?.Naziv ?? "",
          ["kratko_zašto"]: a?.["kratko_zašto"] ?? a?.kratko_zasto ?? null,
        }))
      : [],
  };
}

function parseStructured(data: any) {
  // 1) najčišće
  if (data?.output_parsed) return data.output_parsed;

  // 2) Responses API često vraća parsed unutar content[]
  const firstMsg = Array.isArray(data?.output) ? data.output[0] : null;
  if (Array.isArray(firstMsg?.content)) {
    const withParsed = firstMsg.content.find((c: any) => c && typeof c === "object" && "parsed" in c && c.parsed);
    if (withParsed?.parsed) return withParsed.parsed;
  }

  // 3) fallback – probaj JSON iz teksta
  const textCandidate =
    firstMsg?.content?.find((c: any) => c?.type === "output_text")?.text ??
    data?.output_text ??
    "";

  if (typeof textCandidate === "string") {
    const m = textCandidate.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  }

  const sample = JSON.stringify(
    { output: data?.output?.slice?.(0, 1) ?? data?.output ?? null, output_text: data?.output_text ?? null },
    null,
    2
  ).slice(0, 800);
  throw new Error(`OpenAI ne vraća parsabilan JSON (parser). Sample: ${sample}`);
}

async function callOpenAI(payload: any, apiKey: string) {
  const CTRL_TIMEOUT_MS = 40_000; // 40s
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), CTRL_TIMEOUT_MS);

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

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`OpenAI JSON parse fail: ${text.slice(0, 300)}`);
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`OpenAI request timeout nakon ${CTRL_TIMEOUT_MS} ms`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

// —————————— prompt + schema ——————————

const SYSTEM_PROMPT = `KPD frik v6 — službene upute (Production Mode)
Svrha
Tvoj zadatak je klasifikacija djelatnosti, proizvoda i usluga u skladu s:
NKD 2025 – Nacionalna klasifikacija djelatnosti Republike Hrvatske
KPD 2025 – Klasifikacija proizvoda po djelatnostima Republike Hrvatske
Koristi isključivo dokumente u retrievalu (NKD_2025_struktura_i_objasnjenja.pdf, KPD_2025_struktura.json).

Postupak (sažeto)
1) Odredi NKD_4 (dd.dd ili dd.dd.d) iz NKD PDF-a i vrati i NKD_naziv.
2) Odredi KPD_6 (dd.dd.dd) iz KPD JSON-a s istim prefiksom (prve 4 znamenke kao NKD), koristi stvarne šifre iz dokumenta.
3) Ako KPD_6 ne postoji, stavi null i Poruka: "Šifra nije pronađena u KPD 2025 bazi.", te vrati 2–3 srodne iz istog prefiksa u 'alternativne'.
4) Uvijek vrati JSON strogo po shemi, ništa izvan toga.

Regex:
NKD_4 → ^\\d{2}\\.\\d{2}(\\.\\d)?$
KPD_6 → ^\\d{2}\\.\\d{2}\\.\\d{2}$`;

const JSON_SCHEMA = {
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
        required: ["KPD_6", "Naziv", "kratko_zašto"], // mora postojati key, može biti null
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

// —————————— payload ——————————

function buildPayload(input_as_text: string, vectorIds: string[] | null) {
  return {
    model: "gpt-5",
    input: [
      { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
      { role: "user",   content: [{ type: "input_text", text: input_as_text }] },
    ],
    // Alati samo ako imaš vector store ID-jeve
    tools: vectorIds && vectorIds.length ? [{ type: "file_search" }] : undefined,
    tool_resources:
      vectorIds && vectorIds.length ? { file_search: { vector_store_ids: vectorIds } } : undefined,
    text: {
      format: {
        type: "json_schema",
        name: "KpdResponse",
        schema: JSON_SCHEMA,
        strict: true,
      },
    },
  };
}


// —————————— glavni poziv ——————————

export async function classifyCore(input_as_text: string, env?: AgentEnv): Promise<KpdResponse> {
  const apiKey = env?.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY nije postavljen u Cloudflare Pages > Settings > Environment Variables (Production)."
    );
  }

  const vectorIds = [env?.VS_NKD_ID, env?.VS_KPD_ID].filter(Boolean) as string[];

  try {
    // 1) pokušaj s file_search
    const data = await callOpenAI(buildPayload(input_as_text, vectorIds.length ? vectorIds : null), apiKey);
    const out = parseStructured(data);
    return coerceKpdResponse(out);

  } catch (err: any) {
    // ako je problem s VS/file_search, fallback bez alata
    const msg = String(err?.message || err);
    const looksLikeVS =
      msg.includes("vector_store") ||
      msg.includes("file_search") ||
      msg.includes("tool_resources") ||
      msg.includes("vector") ||
      msg.includes("store");

    if (!looksLikeVS) throw err;

    const dataNoTools = await callOpenAI(buildPayload(input_as_text, null), apiKey);
    const outNoTools = parseStructured(dataNoTools);
    return coerceKpdResponse(outNoTools);
  }
}
