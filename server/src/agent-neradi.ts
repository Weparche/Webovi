import { fileSearchTool, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";
import { z } from "zod";

/* ------- Vector stores ------- */
const vsNkd = process.env.VS_NKD_ID;
const vsKpd = process.env.VS_KPD_ID;
const fallbackVS = "vs_68f0cfbb2d9081918800e3eb92d9d483";

const fileSearch = fileSearchTool([vsNkd, vsKpd, fallbackVS].filter(Boolean) as string[]);

/* ------- Schemas ------- */
const AltSchema = z.object({
  KPD_6: z.string().regex(/^\d{2}\.\d{2}\.\d{2}$/),
  Naziv: z.string(),
  ["kratko_zašto"]: z.string(),
}).strict();

const KpdFrikNkdKpd2025KlasifikatorSchema = z.object({
  NKD_4: z.string().regex(/^\d{2}\.\d{2}(\.\d)?$/),
  NKD_naziv: z.string().nullable(),
  KPD_6: z.string().regex(/^\d{2}\.\d{2}\.\d{2}$/).nullable(),
  Naziv_proizvoda: z.string().nullable(),
  Razlog_odabira: z.string().nullable(),
  Poruka: z.string().nullable(),
  alternativne: z.array(AltSchema),
}).strict();

/* ------- Lean instructions (local-only) ------- */
const instructions = `
KPD frik — NKD/KPD 2025 (kratke upute, PROD)

Cilj: Klasificirati opis u NKD 2025 (podrazred) i KPD 2025 (6-znamenkasta) koristeći ISKLJUČIVO:
- NKD_2025_struktura_i_objasnjenja.pdf
- KPD_2025_struktura.json

Postupak:
1) NKD → Pronađi najbliži podrazred (dd.dd ili dd.dd.d) u PDF-u; 1–2 rečenice objašnjenja terminima iz PDF-a.
2) KPD → U JSON-u filtriraj isti prefiks (prve 4 znamenke kao NKD). Odaberi POSTOJEĆU dd.dd.dd.
   Ako nema, KPD_6=null + Poruka. Uvijek predloži 1–3 stvarne alternative istog prefiksa.
3) Kombinirane radnje (npr. prodaja + ugradnja) → glavna KPD po dominantnoj radnji; u “alternativne” barem jedna šifra druge domene.
4) Validacija → Svaka šifra mora fizički postojati u odgovarajućem dokumentu.

Format (vrati TOČNO JEDAN JSON, bez dodatnog teksta):
{
  "NKD_4":"dd.dd(.d)?",
  "NKD_naziv": string|null,
  "KPD_6":"dd.dd.dd"|null,
  "Naziv_proizvoda": string|null,
  "Razlog_odabira": string|null,
  "Poruka": string|null,
  "alternativne":[
    { "KPD_6":"xx.xx.xx","Naziv":"...","kratko_zašto":"..." }
  ]
}

Regex:
- NKD_4: ^\\d{2}\\.\\d{2}(\\.\\d)?$
- KPD_6: ^\\d{2}\\.\\d{2}\\.\\d{2}$

Zabrane:
- Ne izmišljaj šifre; ne koristi NKD 2007/CPA 2008.
- Ne vraćaj više JSON objekata; ne dodaj tekst izvan JSON-a.
`;

/* ------- Local Agent (no platform agent_id) ------- */
export const kpdFrikNkdKpd2025Klasifikator = new Agent({
  name: "KPD frik – NKD/KPD 2025 klasifikator",
  instructions,                  // lokalne, skraćene upute
  model: "gpt-5",
  tools: [fileSearch],
  outputType: KpdFrikNkdKpd2025KlasifikatorSchema,
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    temperature: 0.1,           // stabilniji i brži izlaz
    store: true
  },
});

/* ------- Types & workflow ------- */
export type WorkflowInput = { input_as_text: string };

export const runWorkflow = async (workflow: WorkflowInput) => {
  return await withTrace("KPDinfo", async () => {
    const conversationHistory: AgentInputItem[] = [
      { role: "user", content: [{ type: "input_text", text: workflow.input_as_text }] }
    ];

    // Runner je lokalni izvršavač; nema poziva platformskog deploya
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_68f162e22c60819094499dd84fda425d0c4320e3bae70006",
      },
    });

    const res = await runner.run(kpdFrikNkdKpd2025Klasifikator, conversationHistory);
    if (!res.finalOutput) throw new Error("Agent result is undefined");

    return {
      output_text: JSON.stringify(res.finalOutput),
      output_parsed: res.finalOutput,
    };
  });
};
