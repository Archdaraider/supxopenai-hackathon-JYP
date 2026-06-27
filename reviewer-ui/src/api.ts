import type { AnalysisResult, ReviewCase } from "./types";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001";
const reviewerToken = import.meta.env.VITE_REVIEWER_ANALYZE_TOKEN || "";

export const datasetDashboardUrl = import.meta.env.VITE_DATASET_DASHBOARD_URL || "http://localhost:8080/dataset-dashboard.html";

export function imageUrl(filename: string, kind: "claim" | "reference" = "claim") {
  return `${apiBase}/api/images/${kind === "reference" ? "reference" : "claims"}/${encodeURIComponent(filename)}`;
}

export async function fetchCases(): Promise<ReviewCase[]> {
  const response = await fetch(`${apiBase}/api/cases`);
  if (!response.ok) throw new Error("Failed to load cases");
  const payload = await response.json() as { cases: ReviewCase[] };
  return payload.cases;
}

export async function analyzeCase(caseId: string): Promise<AnalysisResult> {
  const response = await fetch(`${apiBase}/api/cases/${caseId}/analyze`, {
    method: "POST",
    headers: reviewerToken ? { "X-Reviewer-Token": reviewerToken } : undefined
  });
  if (!response.ok) throw new Error("Failed to analyze case");
  const payload = await response.json() as { analysis: AnalysisResult };
  return payload.analysis;
}
