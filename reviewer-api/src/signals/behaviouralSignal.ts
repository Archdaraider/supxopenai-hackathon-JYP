import type { ReviewCase, SignalResult } from "../types.js";

export function runBehaviouralSignal(reviewCase: ReviewCase): SignalResult {
  const { buyer, seller, order, product } = reviewCase;
  let score = 0;
  const evidence: string[] = [];
  const limitations: string[] = [];

  if (buyer.user_profile_badge === "New User") {
    score += 18;
    evidence.push("Buyer is tagged as New User.");
  }

  if (buyer.user_profile_badge === "Not Verified") {
    score += 14;
    evidence.push("Buyer is Not Verified.");
  }

  if (buyer.identity_verified) {
    score -= 8;
    evidence.push("Buyer has identity verification, which reduces uncertainty but does not clear the claim.");
  }

  if (buyer.account_age_days < 30) {
    score += 14;
    evidence.push(`Buyer account age is ${buyer.account_age_days} days.`);
  } else if (buyer.account_age_days > 365) {
    score -= 6;
    evidence.push(`Buyer account is established at ${buyer.account_age_days} days old.`);
  }

  const refundRate = buyer.total_orders > 0 ? buyer.total_refunds / buyer.total_orders : 0;
  if (refundRate >= 0.45) {
    score += 22;
    evidence.push(`Buyer lifetime refund rate is high at ${Math.round(refundRate * 100)}%.`);
  } else if (refundRate <= 0.1 && buyer.total_orders >= 20) {
    score -= 8;
    evidence.push(`Buyer has low historical refund rate across ${buyer.total_orders} orders.`);
  }

  if (buyer.claims_last_30_days >= 3 || buyer.recent_refund_claims >= 3) {
    score += 20;
    evidence.push(`Buyer has ${buyer.claims_last_30_days} claims in the last 30 days.`);
  }

  if (order.refund_type_requested === "partial") {
    score += 8;
    evidence.push("Buyer requested a partial refund, which is a common abuse pattern but not conclusive.");
  }

  if (product.price_sgd >= 100 || order.refund_amount_requested_sgd >= 75) {
    score += 8;
    evidence.push(`Claim involves higher value exposure: S$${order.refund_amount_requested_sgd}.`);
  }

  if (order.total_claims_against_order >= 3) {
    score -= 34;
    evidence.push("Multiple claims are tied to one order, so logistics or fulfilment context may explain the pattern.");
  }

  if (seller.packaging_complaints_count >= 3 || seller.disputes_last_90d >= 4) {
    score -= 10;
    evidence.push("Seller has recent packaging/dispute context that may support a fulfilment issue.");
  }

  if (seller.user_profile_badge === "Certified Partner" || seller.user_profile_badge === "Preferred Merchant" || seller.user_profile_badge === "Carousell Official") {
    score += 4;
    evidence.push(`Seller profile is ${seller.user_profile_badge}, so seller-side baseline trust is stronger.`);
  }

  if (!buyer.user_profile_badge) limitations.push("Buyer profile badge is unavailable.");
  if (!seller.user_profile_badge) limitations.push("Seller profile badge is unavailable.");

  const bounded = Math.max(0, Math.min(100, score));
  return {
    key: "behavioural",
    label: "Behavioural context",
    status: "complete",
    score: bounded,
    confidence: 0.82,
    explanation: explainBehaviouralScore(bounded),
    evidence,
    limitations,
    raw: {
      refundRate,
      buyerProfileBadge: buyer.user_profile_badge,
      sellerProfileBadge: seller.user_profile_badge
    }
  };
}

function explainBehaviouralScore(score: number) {
  if (score >= 65) return "Behavioural context shows a concentrated pattern of claim velocity, account risk, or high refund exposure.";
  if (score >= 35) return "Behavioural context has some risk indicators but does not justify a hard conclusion by itself.";
  return "Behavioural context is mostly consistent with standard review rather than integrity escalation.";
}
