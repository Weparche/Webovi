// functions/api/kpdinfo/classify.ts
// Jednostavan handler: prima { input_as_text }, zove runWorkflow, vraća KpdResponse.

import { runWorkflow } from "../../../server/src/agent";

export const onRequestPost = async (ctx: any): Promise<Response> => {
  try {
    const body = await ctx.request.json().catch(() => ({}));
    const input = String(body?.input_as_text ?? "").trim();

    if (!input) {
      return new Response(JSON.stringify({ error: "Prazan upit." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Poziv agenta — proslijedi Cloudflare env (OPENAI_API_KEY, VS_*_ID…)
    const kpd = await runWorkflow({ input_as_text: input, env: ctx.env });

    return new Response(JSON.stringify(kpd), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
