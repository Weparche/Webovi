/// <reference types="@cloudflare/workers-types" />

import { classifyCore } from "../../_edge/agent-core";

type Env = {
  OPENAI_API_KEY: string;
  OPENAI_PROJECT?: string;
  OPENAI_ORG?: string;
  VS_NKD_ID?: string;
  VS_KPD_ID?: string;
};

const CORS = {
  "Access-Control-Allow-Origin": "*", // po potrebi stavi točan origin npr. https://kpdinfo.hr
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestPost = async (ctx: { request: Request; env: Env }) => {
  try {
    // --- 1) Parse body sigurno ---
    let body: any = null;
    try {
      body = await ctx.request.json();
    } catch {
      return jsonResponse({ error: "BAD_REQUEST", message: "Tijelo zahtjeva mora biti JSON." }, 400);
    }

    // Prihvaćamo i q i input_as_text (kompatibilnost FE verzija)
    const input = String(body?.input_as_text ?? body?.q ?? "").trim();
    if (!input) return jsonResponse({ error: "BAD_REQUEST", message: "Prazan upit." }, 400);
    if (input.length > 2000) return jsonResponse({ error: "BAD_REQUEST", message: "Upit je predugačak." }, 400);

    // --- 2) Validacija ENV varijabli (odmah vrati jasan hint) ---
    const {
      OPENAI_API_KEY,
      OPENAI_PROJECT,
      OPENAI_ORG,
      VS_NKD_ID,
      VS_KPD_ID,
    } = ctx.env || ({} as Env);

    if (!OPENAI_API_KEY) {
      return jsonResponse(
        { error: "CONFIG_ERROR", message: "OPENAI_API_KEY nije postavljen u env." },
        500
      );
    }

    // Može biti dovoljan jedan VS ako u njemu imaš SVE datoteke (instructions+NKD+KPD)
    if (!VS_NKD_ID && !VS_KPD_ID) {
      return jsonResponse(
        { error: "CONFIG_ERROR", message: "Nije postavljen VS_NKD_ID ili VS_KPD_ID." },
        500
      );
    }

    // --- 3) Pozovi core (proslijedi i Project/Org) ---
    const result = await classifyCore(input, {
      OPENAI_API_KEY,
      OPENAI_PROJECT,
      OPENAI_ORG,
      VS_NKD_ID,
      VS_KPD_ID,
    });

    return jsonResponse(result, 200);
  } catch (e: any) {
    // Cloudflare ima Ray-ID header u requestu; korisno za korelaciju logova
    const ray = ctx.request.headers.get("cf-ray") || undefined;

    // Ne odavati stack u produkciji – samo kratka poruka i trag
    return jsonResponse(
      {
        error: "CLASSIFY_FAILED",
        message: String(e?.message || "Unexpected error"),
        ray, // pomaže u logovima
      },
      500
    );
  }
};
