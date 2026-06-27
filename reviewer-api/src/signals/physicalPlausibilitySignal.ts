import { readFileSync } from "node:fs";
import type { ReviewCase, SignalResult } from "../types.js";

interface PhysicalModelOutput {
  score?: number;
  confidence?: number;
  plausibility?: string;
  observed_damage?: string[];
  visual_integrity_score?: number;
  visual_integrity_notes?: string[];
  reasoning?: string;
  limitations?: string[];
  recommended_reviewer_action?: string;
}

export async function runPhysicalPlausibilitySignal(reviewCase: ReviewCase, imagePath: string): Promise<SignalResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const image = reviewCase.primaryImage;

  if (!apiKey) {
    return {
      key: "physical_plausibility",
      label: "Physical damage plausibility",
      status: "not_configured",
      score: null,
      confidence: null,
      explanation: "OpenAI API key is not configured. This signal was not used in the final score.",
      evidence: ["Expected env var: OPENAI_API_KEY.", `Configured model: ${model}.`],
      limitations: ["No visual physical plausibility model call was run."],
      raw: null
    };
  }

  if (!image) {
    return {
      key: "physical_plausibility",
      label: "Physical damage plausibility",
      status: "error",
      score: null,
      confidence: null,
      explanation: "No image was available for physical plausibility analysis.",
      evidence: [],
      limitations: ["Missing claim image."],
      raw: null
    };
  }

  try {
    const mimeType = mimeFromFilename(image.filename);
    const base64 = readFileSync(imagePath).toString("base64");
    const prompt = [
      "You are assisting a Carousell trust-and-safety reviewer.",
      "Assess the submitted evidence image using two bounded checks: physical damage plausibility and visual integrity cues.",
      "Physical plausibility means whether the claimed crack/chip/defect makes sense for the product material and listed failure modes.",
      "Visual integrity means whether the image has visible signs of synthetic generation, local editing, inconsistent lighting/shadows, impossible geometry, pasted damage, or artifact patterns. This is not a provenance or watermark check.",
      "Do not decide fraud. Return only valid JSON with keys: score, confidence, plausibility, observed_damage, visual_integrity_score, visual_integrity_notes, reasoning, limitations, recommended_reviewer_action.",
      "score is 0-100 where higher means the overall visual/physical evidence needs more reviewer scrutiny.",
      "visual_integrity_score is 0-100 where higher means stronger visible AI/tamper/anomaly concern. If uncertain, use a moderate score and explain limitations.",
      `Product: ${reviewCase.product.name}`,
      `Material: ${reviewCase.product.material}`,
      `Typical failure modes: ${reviewCase.product.typical_failure_modes.join("; ")}`,
      `Buyer claim: ${reviewCase.claim.refund_request_description}`,
      `Seller response: ${reviewCase.sellerResponse}`
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: `data:${mimeType};base64,${base64}` }
          ]
        }]
      })
    });

    const raw = await response.json() as { output_text?: string; error?: { message?: string }; output?: unknown };
    if (!response.ok) {
      return errorResult(raw.error?.message || "OpenAI request failed.", raw);
    }

    const outputText = extractOutputText(raw);
    const parsed = parseModelJson(outputText);
    if (!parsed) return errorResult("OpenAI returned output that could not be parsed as JSON.", raw);

    const score = Math.max(0, Math.min(100, Number(parsed.score ?? 50)));
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.5)));
    const observedDamage = normalizeStringList(parsed.observed_damage);
    const visualIntegrityScore = clampScore(parsed.visual_integrity_score);
    const visualIntegrityNotes = normalizeStringList(parsed.visual_integrity_notes);
    const limitations = normalizeStringList(parsed.limitations);
    return {
      key: "physical_plausibility",
      label: "Physical damage plausibility",
      status: "complete",
      score,
      confidence,
      explanation: parsed.reasoning || "Physical plausibility analysis completed.",
      evidence: [
        `Model: ${model}.`,
        `Plausibility: ${parsed.plausibility || "unspecified"}.`,
        `Visual integrity concern: ${visualIntegrityScore}.`,
        ...visualIntegrityNotes.map((item) => `Visual note: ${item}.`),
        ...observedDamage.map((item) => `Observed: ${item}.`)
      ],
      limitations: limitations.length ? limitations : ["Single-image visual reasoning should be treated as advisory."],
      raw: parsed
    };
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "OpenAI request failed.", null);
  }
}

function errorResult(message: string, raw: unknown): SignalResult {
  return {
    key: "physical_plausibility",
    label: "Physical damage plausibility",
    status: "error",
    score: null,
    confidence: null,
    explanation: message,
    evidence: [],
    limitations: ["OpenAI signal was excluded from scoring."],
    raw
  };
}

function extractOutputText(raw: { output_text?: string; output?: unknown }) {
  if (typeof raw.output_text === "string") return raw.output_text;
  const output = raw.output;
  if (!Array.isArray(output)) return "";
  return output.flatMap((item) => {
    if (!item || typeof item !== "object" || !("content" in item)) return [];
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) return [];
    return content.flatMap((part) => {
      if (!part || typeof part !== "object") return [];
      const candidate = part as { text?: unknown };
      return typeof candidate.text === "string" ? [candidate.text] : [];
    });
  }).join("\n");
}

function parseModelJson(text: string): PhysicalModelOutput | null {
  try {
    return JSON.parse(text) as PhysicalModelOutput;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as PhysicalModelOutput;
    } catch {
      return null;
    }
  }
}

function mimeFromFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => typeof item === "string" ? [item] : []);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function clampScore(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}
