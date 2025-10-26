// functions/api/kpdinfo/classify.ts
// Edge-safe, bez Node API-ja. Radi s payloadom { input_as_text } i vraća KpdResponse.

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

    // ---- Minimalna, radna logika samo da UI prođe validateResponse ----
    // (Zamijeni ovim dio s tvojom pravom klasifikacijom kad bude spremna.)
    const isWeb = /web|stranic/i.test(input);
    let result;

    if (isWeb) {
      // Usklađeno s tvojim primjerom u App.tsx (“Izrada web stranice”)
      result = {
        NKD_4: "62.10.9",
        NKD_naziv: "Ostalo računalno programiranje",
        KPD_6: "62.10.11",
        Naziv_proizvoda: "Usluge IT dizajna i razvoja aplikacija",
        Razlog_odabira:
          "Izrada web stranice razvrstava se u NKD 62.10.9; u KPD 2025 odgovara 62.10.11.",
        Poruka: null,
        alternativne: [
          { KPD_6: "62.10.12", Naziv: "Usluge IT dizajna i razvoja mreža i sustava", "kratko_zašto": "Ako uključuje mrežnu/sustavsku infrastrukturu." },
          { KPD_6: "62.10.22", Naziv: "Ostali originalni softver", "kratko_zašto": "Ako isporučuješ gotov softver kao proizvod." },
        ],
      };
    } else {
      // Usklađeno s tvojim primjerom “Prodaja stolica u salonu”
      result = {
        NKD_4: "47.55.0",
        NKD_naziv: "trgovina na malo namještajem",
        KPD_6: "47.55.01",
        Naziv_proizvoda: "Usluge trgovine na malo namještajem",
        Razlog_odabira:
          "Prodaja namještaja spada u NKD 47.55.0; u KPD 2025 odgovara 47.55.01.",
        Poruka: null,
        alternativne: [
          { KPD_6: "47.55.02", Naziv: "Usluge trgovine na malo opremom za rasvjetu", "kratko_zašto": "Ako asortiman uključuje rasvjetu." },
          { KPD_6: "47.55.03", Naziv: "Usluge trgovine na malo drvenim, plutenim i pletarskim proizvodima", "kratko_zašto": "Ako je fokus na tim artiklima." },
        ],
      };
    }

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

// (opcionalno) Healthcheck za GET:
/*
export const onRequestGet = async () =>
  new Response("OK", { status: 200 });
*/
