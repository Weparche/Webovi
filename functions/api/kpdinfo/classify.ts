/// <reference types="@cloudflare/workers-types" />

import { classifyCore } from "../../_edge/agent-core";

type Env = {
  OPENAI_API_KEY: string;
  OPENAI_PROJECT?: string;
  OPENAI_ORG?: string;
  VS_NKD_ID?: string;
  VS_KPD_ID?: string;
};

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";
  const allowOrigin =
    /https?:\/\/(localhost(:\d+)?|127\.0\.0\.1|www\.kpdinfo\.com|kpdinfo\.com)$/i.test(origin)
      ? origin
      : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

export const onRequestOptions = async ({ request }: { request: Request }) =>
  new Response(null, { status: 204, headers: buildCorsHeaders(request) });

export const onRequestPost = async (ctx: { request: Request; env: Env }) => {
  const CORS = buildCorsHeaders(ctx.request);

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...CORS },
    });

  try {
    // 1) Sigurno parsiranje JSON-a
    let body: any;
    try {
      body = await ctx.request.json();
    } catch {
      return json({ error: "BAD_REQUEST", message: "Tijelo zahtjeva mora biti JSON." }, 400);
    }

    // 2) Prihvaćaj i `q` i `input_as_text`
    const input = String(body?.input_as_text ?? body?.q ?? "").trim();
    if (!input) return json({ error: "BAD_REQUEST", message: "Prazan upit." }, 400);

    // 3) ENV provjera
    const { OPENAI_API_KEY, OPENAI_PROJECT, OPENAI_ORG, VS_NKD_ID, VS_KPD_ID } = ctx.env || {};
    if (!OPENAI_API_KEY) return json({ error: "CONFIG_ERROR", message: "OPENAI_API_KEY nije postavljen." }, 500);
    if (!VS_NKD_ID && !VS_KPD_ID)
      return json({ error: "CONFIG_ERROR", message: "Nedostaje VS_NKD_ID ili VS_KPD_ID." }, 500);

    // 4) Poziv core-a (proslijedi i Project/Org)
    const out = await classifyCore(input, {
      OPENAI_API_KEY,
      OPENAI_PROJECT,
      OPENAI_ORG,
      VS_NKD_ID,
      VS_KPD_ID,
    });

    return json(out, 200);
  } catch (e: any) {
    const ray = ctx.request.headers.get("cf-ray") || undefined;
    return json(
      { error: "CLASSIFY_FAILED", message: String(e?.message || "Unexpected error"), ray },
      500
    );
  }
};
