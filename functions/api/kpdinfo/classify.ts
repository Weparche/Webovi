// functions/api/kpdinfo/classify.ts
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

    // 🔴 NEMA više placeholdera: zovi agenta
    const result = await runWorkflow({ input_as_text: input, env: ctx.env });

    return new Response(JSON.stringify(result), {
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

