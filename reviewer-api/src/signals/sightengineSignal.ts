import { openAsBlob } from "node:fs";
import type { ReviewCase, SignalResult } from "../types.js";

interface SightengineResponse {
  status?: string;
  error?: { type?: string; message?: string };
  type?: {
    ai_generated?: number;
    deepfake?: number;
  };
  [key: string]: unknown;
}

export async function runSightengineSignal(reviewCase: ReviewCase, imagePath: string): Promise<SignalResult> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;
  const image = reviewCase.primaryImage;

  if (!apiUser || !apiSecret) {
    return {
      key: "sightengine",
      label: "Sightengine AI image likelihood",
      status: "not_configured",
      score: null,
      confidence: null,
      explanation: "Sightengine API credentials are not configured. This signal was not used in the final score.",
      evidence: ["Expected env vars: SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET."],
      limitations: ["No real Sightengine check was run."],
      raw: null
    };
  }

  if (!image) {
    return {
      key: "sightengine",
      label: "Sightengine AI image likelihood",
      status: "error",
      score: null,
      confidence: null,
      explanation: "No image was available for Sightengine analysis.",
      evidence: [],
      limitations: ["Missing claim image."],
      raw: null
    };
  }

  try {
    const form = new FormData();
    form.append("models", "genai");
    form.append("api_user", apiUser);
    form.append("api_secret", apiSecret);
    form.append("media", await openAsBlob(imagePath), image.filename);

    const response = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: form
    });

    const raw = await response.json() as SightengineResponse;
    if (!response.ok || raw.status === "failure") {
      return {
        key: "sightengine",
        label: "Sightengine AI image likelihood",
        status: "error",
        score: null,
        confidence: null,
        explanation: raw.error?.message || "Sightengine request failed.",
        evidence: [`Image checked: ${image.filename}.`],
        limitations: ["Sightengine returned an error, so this signal was excluded from scoring."],
        raw
      };
    }

    const aiGenerated = clamp01(Number(raw.type?.ai_generated ?? 0));
    return {
      key: "sightengine",
      label: "Sightengine AI image likelihood",
      status: "complete",
      score: Math.round(aiGenerated * 100),
      confidence: 0.86,
      explanation: aiGenerated >= 0.75
        ? "Sightengine reports a high AI-generated or AI-edited image likelihood."
        : aiGenerated >= 0.35
          ? "Sightengine reports a mixed AI image likelihood; use alongside other signals."
          : "Sightengine does not report strong AI image likelihood.",
      evidence: [
        `Sightengine models=genai checked ${image.filename}.`,
        `type.ai_generated=${aiGenerated.toFixed(2)}.`
      ],
      limitations: [
        "Sightengine genai detection is pixel-based and should not be described as C2PA/SynthID provenance verification."
      ],
      raw
    };
  } catch (error) {
    return {
      key: "sightengine",
      label: "Sightengine AI image likelihood",
      status: "error",
      score: null,
      confidence: null,
      explanation: error instanceof Error ? error.message : "Sightengine request failed.",
      evidence: [`Image attempted: ${image.filename}.`],
      limitations: ["Network or API failure excluded this signal from scoring."],
      raw: null
    };
  }
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
