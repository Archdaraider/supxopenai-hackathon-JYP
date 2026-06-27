import type { ReviewCase, SignalResult } from "../types.js";

export function runEvidenceSufficiencySignal(reviewCase: ReviewCase): SignalResult {
  const evidence: string[] = [];
  const limitations: string[] = [];
  let score = 12;

  const description = reviewCase.claim.refund_request_description.toLowerCase();
  const image = reviewCase.primaryImage;

  if (!image) {
    score += 55;
    limitations.push("No claim image is attached.");
  } else {
    evidence.push(`Attached image: ${image.filename}.`);
    if (image.metadata_status === "stripped") {
      score += 7;
      limitations.push("Image metadata is stripped, so capture provenance cannot be checked from EXIF.");
    }
  }

  if (!description.includes("packag")) {
    score += 12;
    limitations.push("Buyer description does not include packaging condition.");
  } else {
    evidence.push("Buyer description mentions packaging context.");
  }

  if (description.includes("blurry")) {
    score += 10;
    limitations.push("Buyer or dataset notes indicate blurry image evidence.");
  }

  if (reviewCase.sellerResponse.length > 20) {
    evidence.push("Seller rejection reason is available for reviewer context.");
  } else {
    score += 8;
    limitations.push("Seller response is too thin for context.");
  }

  if (reviewCase.order.dispute_window_deadline) {
    evidence.push(`Dispute deadline available: ${reviewCase.order.dispute_window_deadline}.`);
  }

  const bounded = Math.max(0, Math.min(100, score));
  return {
    key: "evidence_sufficiency",
    label: "Evidence sufficiency",
    status: "complete",
    score: bounded,
    confidence: 0.72,
    explanation: bounded >= 40
      ? "Evidence gaps mean the reviewer should request additional supporting material before relying on the claim."
      : "Evidence package is sufficient for initial review, though it may still need policy checks.",
    evidence,
    limitations,
    raw: {
      hasImage: Boolean(image),
      metadataStatus: image?.metadata_status ?? null
    }
  };
}
