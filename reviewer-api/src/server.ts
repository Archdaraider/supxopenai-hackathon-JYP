import "dotenv/config";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { DataStore } from "./dataStore.js";
import { scoreCase } from "./scorer.js";
import { runBehaviouralSignal } from "./signals/behaviouralSignal.js";
import { runEvidenceSufficiencySignal } from "./signals/evidenceSufficiencySignal.js";
import { runPhysicalPlausibilitySignal } from "./signals/physicalPlausibilitySignal.js";
import { runSightengineSignal } from "./signals/sightengineSignal.js";
import type { AnalysisResult } from "./types.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const store = new DataStore();
const analysisCache = new Map<string, AnalysisResult>();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed"));
  }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "carousell-reviewer-api",
    datasetDashboardUrl: process.env.DATASET_DASHBOARD_URL || "http://localhost:8080/dataset-dashboard.html"
  });
});

app.get("/api/cases", (_request, response) => {
  response.json({
    cases: store.getCases().map((reviewCase) => ({
      ...reviewCase,
      status: analysisCache.has(reviewCase.id) ? "analyzed" : "ready"
    }))
  });
});

app.get("/api/cases/:id", (request, response) => {
  const reviewCase = store.getCase(request.params.id);
  if (!reviewCase) {
    response.status(404).json({ error: "case_not_found" });
    return;
  }
  response.json({
    case: {
      ...reviewCase,
      status: analysisCache.has(reviewCase.id) ? "analyzed" : "ready"
    },
    analysis: analysisCache.get(reviewCase.id) ?? null
  });
});

app.post("/api/cases/:id/analyze", async (request, response) => {
  if (!isAnalyzeAllowed(request)) {
    response.status(403).json({
      error: "reviewer_token_required",
      message: "Set REVIEWER_ANALYZE_TOKEN on the API and send X-Reviewer-Token from the reviewer UI when paid API keys are configured."
    });
    return;
  }

  const reviewCase = store.getCase(request.params.id);
  if (!reviewCase) {
    response.status(404).json({ error: "case_not_found" });
    return;
  }

  const force = request.query.force === "true" || request.body?.force === true;
  const cached = analysisCache.get(reviewCase.id);
  if (cached && !force) {
    response.json({ analysis: { ...cached, cached: true } });
    return;
  }

  const imagePath = reviewCase.primaryImage ? store.getClaimImagePath(reviewCase.primaryImage.filename) : "";
  const signals = [
    runBehaviouralSignal(reviewCase),
    await runSightengineSignal(reviewCase, imagePath),
    await runPhysicalPlausibilitySignal(reviewCase, imagePath),
    runEvidenceSufficiencySignal(reviewCase)
  ];
  const analysis = scoreCase(reviewCase, signals, false);
  analysisCache.set(reviewCase.id, analysis);
  response.json({ analysis });
});

app.get("/api/images/claims/:filename", (request, response) => {
  const path = store.getClaimImagePath(request.params.filename);
  if (!existsSync(path)) {
    response.status(404).json({ error: "image_not_found" });
    return;
  }
  response.sendFile(path);
});

app.get("/api/images/reference/:filename", (request, response) => {
  const path = store.getReferenceImagePath(request.params.filename);
  if (!existsSync(path)) {
    response.status(404).json({ error: "image_not_found" });
    return;
  }
  response.sendFile(path);
});

app.listen(port, () => {
  console.log(`Reviewer API running at http://localhost:${port}`);
});

function isAnalyzeAllowed(request: express.Request) {
  const paidApisConfigured = Boolean(process.env.OPENAI_API_KEY || (process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET));
  if (!paidApisConfigured) return true;

  const expected = process.env.REVIEWER_ANALYZE_TOKEN;
  if (!expected) return false;

  const provided = request.header("x-reviewer-token");
  return provided === expected;
}
