import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequestPost: PagesFunction = async (ctx) => {
  try {
    const body = await ctx.request.json();
    const input = String(body?.input_as_text ?? "").trim();
    if (!input) return new Response(JSON.stringify({ error: "Prazan upit." }), { status: 400 });

    // Importaj svoju “čistu” agent logiku (bez express/cors!) – npr.:
    // import { runWorkflow } from "../../lib/agent";
    // const result = await runWorkflow({ input_as_text: input });

    // PRIVREMENO: mock da provjeriš wiring
    const result = { NKD_4: "47.55.0", NKD_naziv: "trg. na malo namještajem", KPD_6: "47.55.01", Naziv_proizvoda: "Usluge trg. na malo namještajem", Razlog_odabira: "Demo", Poruka: null, alternativne: [] };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500 });
  }
};
