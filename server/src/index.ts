import "dotenv/config";
import express from "express";
import cors from "cors";
import { runWorkflow } from "./agent";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));

function normalize(resp: any) {
  return {
    NKD_4: resp?.NKD_4 ?? null,
    NKD_naziv: resp?.NKD_naziv ?? null, // ← NOVO
    KPD_6: resp?.KPD_6 ?? null,
    Naziv_proizvoda: resp?.Naziv_proizvoda ?? null,
    Razlog_odabira: resp?.Razlog_odabira ?? null,
    Poruka: resp?.Poruka ?? null,
    alternativne: Array.isArray(resp?.alternativne) ? resp.alternativne : []
  };
}


app.post("/api/kpdinfo/classify", async (req, res) => {
  try {
    const text: string = req.body?.input_as_text ?? "";
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "input_as_text je obavezan string" });
    }

    const { output_parsed } = await runWorkflow({ input_as_text: text });
    res.json(normalize(output_parsed));
  } catch (err: any) {
    console.error("/classify error", err);
    res.status(500).json({ error: err?.message || "Internal error" });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
