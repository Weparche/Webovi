export type AltItem = {
  KPD_6: string;
  Naziv: string;
  "kratko_zašto": string;
};

export type KpdResponse = {
  NKD_4: string;
  NKD_naziv: string | null;   // ← NOVO
  KPD_6: string | null;
  Naziv_proizvoda: string | null;
  Razlog_odabira: string | null;
  Poruka: string | null;
  alternativne: AltItem[];
};

export const reNKD = /^\d{2}\.\d{2}(\.\d)?$/;
export const reKPD = /^\d{2}\.\d{2}\.\d{2}$/;

export function validateResponse(r: any): asserts r is KpdResponse {
  const must = ["NKD_4", "NKD_naziv", "KPD_6", "Naziv_proizvoda", "Razlog_odabira", "Poruka", "alternativne"] as const;
  for (const k of must) if (!(k in r)) throw new Error(`Nedostaje polje: ${k}`);
  if (typeof r.NKD_4 !== "string" || !reNKD.test(r.NKD_4)) throw new Error("NKD_4 format neispravan (dd.dd ili dd.dd.d)");
  if (r.NKD_naziv !== null && typeof r.NKD_naziv !== "string") throw new Error("NKD_naziv mora biti string ili null"); // ← NOVO
  if (r.KPD_6 !== null && (typeof r.KPD_6 !== "string" || !reKPD.test(r.KPD_6))) throw new Error("KPD_6 format neispravan (dd.dd.dd) ili nije string/null");
  if (r.Naziv_proizvoda !== null && typeof r.Naziv_proizvoda !== "string") throw new Error("Naziv_proizvoda mora biti string ili null");
  if (r.Razlog_odabira !== null && typeof r.Razlog_odabira !== "string") throw new Error("Razlog_odabira mora biti string ili null");
  if (r.Poruka !== null && typeof r.Poruka !== "string") throw new Error("Poruka mora biti string ili null");
  if (!Array.isArray(r.alternativne)) throw new Error("alternativne mora biti niz");
  for (const a of r.alternativne) {
    if (!a || typeof a !== "object") throw new Error("alt stavka mora biti objekt");
    if (typeof a.KPD_6 !== "string" || !reKPD.test(a.KPD_6)) throw new Error("alt.KPD_6 format neispravan");
    if (typeof a.Naziv !== "string") throw new Error("alt.Naziv mora biti string");
    if (typeof a["kratko_zašto"] !== "string") throw new Error("alt.kratko_zašto mora biti string");
  }
}

export const pretty = (obj: unknown) => JSON.stringify(obj, null, 2);
export const escapeHtml = (s: unknown) =>
  String(s).replace(/[&<>\"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as any)[m]);
