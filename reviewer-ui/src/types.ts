export type RiskLevel = "Low" | "Elevated" | "High";
export type SignalStatus = "complete" | "not_configured" | "error";

export interface BuyerAccount {
  id: string;
  display_name: string;
  account_created_at: string;
  account_age_days: number;
  total_orders: number;
  total_refunds: number;
  recent_refund_claims: number;
  claims_last_30_days: number;
  profile_note?: string;
  user_profile_badge?: string;
  identity_verified?: boolean;
  user_profile_meaning?: string;
  user_profile_reviewer_guidance?: string;
}

export interface Seller {
  id: string;
  display_name: string;
  seller_type: string;
  seller_created_at: string;
  orders_last_90d: number;
  disputes_last_90d: number;
  packaging_complaints_count: number;
  user_profile_badge?: string;
  identity_verified?: boolean;
  user_profile_meaning?: string;
  user_profile_reviewer_guidance?: string;
}

export interface Order {
  id: string;
  ordered_at: string;
  delivered_at: string;
  total_claims_against_order: number;
  fulfilment_method: string;
  programme: string;
  refund_type_requested: string;
  refund_amount_requested_sgd: number;
  return_required: boolean;
  dispute_window_deadline: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  material: string;
  typical_failure_modes: string[];
  price_sgd: number;
}

export interface ClaimImage {
  image_id: string;
  filename: string;
  role: string;
  metadata_status: string;
  source: string;
  capture_context: string;
}

export interface Claim {
  id: string;
  reason_category: string;
  refund_request_description: string;
  claim_text: string;
  images: ClaimImage[];
}

export interface ReviewCase {
  id: string;
  status: "ready" | "analyzed";
  buyer: BuyerAccount;
  seller: Seller;
  order: Order;
  product: Product;
  claim: Claim;
  primaryImage?: ClaimImage;
  sellerResponse: string;
  escalationSummary: string;
  timeline: Array<{ label: string; date: string; detail: string }>;
}

export interface SignalResult {
  key: "behavioural" | "sightengine" | "physical_plausibility" | "evidence_sufficiency";
  label: string;
  status: SignalStatus;
  score: number | null;
  confidence: number | null;
  explanation: string;
  evidence: string[];
  limitations: string[];
  raw?: unknown;
}

export interface AnalysisResult {
  caseId: string;
  generatedAt: string;
  cached: boolean;
  finalRiskScore: number;
  finalRiskLevel: RiskLevel;
  recommendedAction: string;
  summary: string;
  weights: Record<string, number>;
  signals: SignalResult[];
  guardrailsApplied: string[];
}
