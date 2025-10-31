/// <reference types="@cloudflare/workers-types" />

import { classifyCore } from "../../_edge/agent-core";

export const onRequestPost = async (ctx: any) => {
  try {
    const body = await ctx.request.json();
    const input = String(body?.input_as_text ?? "").trim();
    if (!input) {
      return new Response(JSON.stringify({ error: "Prazan upit." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await classifyCore(input, {
      OPENAI_API_KEY: ctx.env?.OPENAI_API_KEY,
      VS_NKD_ID: ctx.env?.VS_NKD_ID,
      VS_KPD_ID: ctx.env?.VS_KPD_ID,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
