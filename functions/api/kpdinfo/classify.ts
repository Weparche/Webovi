// functions/api/kpdinfo/classify.ts
import { classifyCore } from "../../_edge/agent-core";

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

    const result = await classifyCore(input, ctx.env);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const msg = e?.message ?? "Unexpected error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
