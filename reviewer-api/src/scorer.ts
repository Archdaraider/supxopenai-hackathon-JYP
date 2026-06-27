import type { AnalysisResult, ReviewCase, SignalResult } from "./types.js";

const baseWeights: Record<SignalResult["key"], number> = {
  behavioural: 0.4,
  sightengine: 0.35,
  physical_plausibility: 0.15,
  evidence_sufficiency: 0.1
};

export function scoreCase(reviewCase: ReviewCase, signals: SignalResult[], cached: boolean): AnalysisResult {
  const completeSignals = signals.filter((signal) => signal.status === "complete" && signal.score !== null);
  const activeWeightTotal = completeSignals.reduce((sum, signal) => sum + baseWeights[signal.key], 0);
  const weightedScore = activeWeightTotal > 0
    ? completeSignals.reduce((sum, signal) => sum + (signal.score ?? 0) * baseWeights[signal.key], 0) / activeWeightTotal
    : 0;

  const guardrailsApplied: string[] = [];
  let finalRiskScore = Math.round(weightedScore);
  const unavailableSignals = signals.filter((signal) => signal.status === "not_configured");
  if (unavailableSignals.length) {
    guardrailsApplied.push(`Provisional score: ${unavailableSignals.map((signal) => signal.label).join(", ")} unavailable.`);
  }

  const physical = signals.find((signal) => signal.key === "physical_plausibility");
  const behavioural = signals.find((signal) => signal.key === "behavioural");
  const sightengine = signals.find((signal) => signal.key === "sightengine");
  const evidence = signals.find((signal) => signal.key === "evidence_sufficiency");

  if (physical?.status === "complete" && physical.score !== null && physical.score >= 80 && finalRiskScore >= 70) {
    const otherConfiguredHigh = [behavioural, sightengine, evidence]
      .some((signal) => signal?.status === "complete" && (signal.score ?? 0) >= 60);
    if (!otherConfiguredHigh) {
      finalRiskScore = Math.min(finalRiskScore, 64);
      guardrailsApplied.push("Physical plausibility alone cannot produce High risk.");
    }
  }

  if (behavioural?.status === "complete" && behavioural.score !== null && behavioural.score >= 80) {
    const hasOtherSignal = [sightengine, physical, evidence]
      .some((signal) => signal?.status === "complete" && (signal.score ?? 0) >= 50);
    if (!hasOtherSignal) {
      finalRiskScore = Math.min(finalRiskScore, 64);
      guardrailsApplied.push("Behavioural context alone cannot produce High risk.");
    }
  }

  if (reviewCase.order.total_claims_against_order >= 3 && (evidence?.score ?? 0) < 40) {
    finalRiskScore = Math.min(finalRiskScore, 34);
    guardrailsApplied.push("Same-order damage cluster capped buyer-integrity risk and routed toward seller/logistics review.");
  }

  const finalRiskLevel = finalRiskScore >= 70 ? "High" : finalRiskScore >= 35 ? "Elevated" : "Low";
  const recommendedAction = chooseAction(reviewCase, finalRiskLevel, signals);

  return {
    caseId: reviewCase.id,
    generatedAt: new Date().toISOString(),
    cached,
    finalRiskScore,
    finalRiskLevel,
    recommendedAction,
    summary: buildSummary(finalRiskLevel, recommendedAction, signals),
    weights: baseWeights,
    signals,
    guardrailsApplied
  };
}

function chooseAction(reviewCase: ReviewCase, riskLevel: "Low" | "Elevated" | "High", signals: SignalResult[]) {
  const sightengine = signals.find((signal) => signal.key === "sightengine");
  const evidence = signals.find((signal) => signal.key === "evidence_sufficiency");

  if (riskLevel === "High") return "Escalate to integrity review";
  if (sightengine?.status === "complete" && (sightengine.score ?? 0) >= 70) return "Escalate to integrity review";
  if (evidence?.status === "complete" && (evidence.score ?? 0) >= 40) return "Request more evidence";
  if (reviewCase.order.total_claims_against_order >= 3 || reviewCase.seller.packaging_complaints_count >= 3) return "Route to seller/logistics review";
  if (riskLevel === "Elevated") return "Request more evidence";
  return "Proceed with standard refund review";
}

function buildSummary(riskLevel: string, action: string, signals: SignalResult[]) {
  const unavailable = signals.filter((signal) => signal.status === "not_configured").map((signal) => signal.label);
  const suffix = unavailable.length ? ` Unavailable signals: ${unavailable.join(", ")}.` : "";
  return `Risk is ${riskLevel}. Recommended action: ${action}.${suffix}`;
}
