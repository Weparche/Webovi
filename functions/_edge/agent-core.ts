// functions/_edge/agent-core.ts
export type KpdResponse = {
  NKD_4: string | null;
  NKD_naziv: string | null;
  KPD_6: string | null;
  Naziv_proizvoda: string | null;
  Razlog_odabira: string | null;
  Poruka: string | null;
  alternativne: Array<{ KPD_6: string | null; Naziv: string; ["kratko_zašto"]?: string }>;
};

export type AgentEnv = {
  OPENAI_API_KEY?: string;
  VS_NKD_ID?: string;
  VS_KPD_ID?: string;
};

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
          ["kratko_zašto"]: a?.["kratko_zašto"] ?? a?.kratko_zasto ?? undefined,
        }))
      : [],
  };
}

const SYSTEM_PROMPT = `
Ti si službeni KPD/NKD 2025 klasifikator. Koristi isključivo dokumente iz file_search:
- NKD_2025_struktura_i_objasnjenja.pdf
- KPD_2025_struktura.json

1) Odredi NKD_4 (dd.dd ili dd.dd.d) + NKD_naziv iz NKD PDF-a.
2) Odredi KPD_6 (dd.dd.dd) iz KPD JSON-a istog prefiksa. Ako ne postoji točan KPD: KPD_6=null, Naziv_proizvoda=null, Poruka s objašnjenjem.
3) Dodaj 1–3 stvarne alternativne KPD šifre istog prefiksa, s "kratko_zašto".
4) Regex: NKD_4 ^\\d{2}\\.\\d{2}(\\.\\d)?$, KPD_6 ^\\d{2}\\.\\d{2}\\.\\d{2}$ (ako postoji).
Vrati točno JEDAN JSON: NKD_4, NKD_naziv, KPD_6, Naziv_proizvoda, Razlog_odabira, Poruka, alternativne[].
`;

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    NKD_4: { type: "string" },
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
        required: ["KPD_6", "Naziv"],
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

async function callOpenAI(payload: any, apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
}

function buildPayload(input_as_text: string, vectorIds: string[] | null) {
  return {
    model: "gpt-5",
    input: [
      { role: "system", content: [{ type: "output_text", text: SYSTEM_PROMPT }] },
      { role: "user", content: [{ type: "input_text", text: input_as_text }] },
    ],
    tools: vectorIds && vectorIds.length ? [{ type: "file_search" }] : undefined,
    tool_resources:
      vectorIds && vectorIds.length ? { file_search: { vector_store_ids: vectorIds } } : undefined,
    text: {
  format: "json_schema",
  json_schema: { name: "KpdResponse", schema: JSON_SCHEMA, strict: true },
},
  };
}

export async function classifyCore(input_as_text: string, env?: AgentEnv): Promise<KpdResponse> {
  const apiKey = env?.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY nije postavljen u Pages > Settings > Environment Variables (Production).");

  const vectorIds = [env?.VS_NKD_ID, env?.VS_KPD_ID].filter(Boolean) as string[]; // bez fallbacka – držimo se tvojih ID-eva
  try {
    // 1) Pokušaj s file_search
    const data = await callOpenAI(buildPayload(input_as_text, vectorIds), apiKey);
    const out =
      data?.output_parsed ??
      (() => {
        const t =
          data?.output?.[0]?.content?.find((c: any) => c?.type === "output_text")?.text ??
          data?.output_text ??
          "";
        return t && t.trim().startsWith("{") ? JSON.parse(t) : null;
      })();

    if (!out) throw new Error("OpenAI ne vraća parsabilan JSON (s file_search).");
    return coerceKpdResponse(out);
  } catch (err: any) {
    // 2) Ako je problem oko vektorskih storeova, pokušaj BEZ alata da izoliraš auth/model
    const msg = String(err?.message || err);
    const looksLikeVS =
      msg.includes("vector_store") || msg.includes("file_search") || msg.includes("tool_resources");
    if (!looksLikeVS) throw err; // nije VS problem – digni grešku

    const data = await callOpenAI(buildPayload(input_as_text, null), apiKey);
    const out =
      data?.output_parsed ??
      (() => {
        const t =
          data?.output?.[0]?.content?.find((c: any) => c?.type === "output_text")?.text ??
          data?.output_text ??
          "";
        return t && t.trim().startsWith("{") ? JSON.parse(t) : null;
      })();

    if (!out) throw new Error("OpenAI ne vraća parsabilan JSON (bez file_search).");
    return coerceKpdResponse(out);
  }
}
