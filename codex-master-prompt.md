# Codex Master Prompt — Claim-Integrity Agent

> Paste this file as your first Codex message. Codex builds in **stages and STOPs after each one** for review + commit. Do not skip the stops.

---

## What This Project Is

A Carousell internal reviewer dashboard for triaging **cash refund claims** across Carousell's marketplace and direct-sales surfaces. Carousell is not only meet-up trading: it includes buyer-seller marketplace transactions, shipped orders, Buyer Protection purchases, Certified purchases, cart orders, and legitimate buyer-shop/direct-sales style purchases where post-purchase refund policy applies.

The target workflow is a buyer who has completed or received an order and submits evidence for a monetary refund. The highest-risk pattern is a buyer submitting damage photos to claim a cash payout while keeping the item they actually received intact.

The app does **not** auto-approve or auto-reject. It is a human-in-the-loop triage layer. A Carousell reviewer signs in, sees a queue of buyer refund claims, and uses a **0–100 Risk Score** + band + plain-English explanation to decide their next action.

This is a **proof-of-work hackathon build**, not a black-box classifier demo. Every score must be inspectable: the reviewer should see the input evidence, each signal's evidence, the risk/confidence/weight math, hard-flag rules, and why the final recommendation follows from Carousell policy. The product thesis is:

> Trust-and-safety reviewers do not need an AI that silently decides fraud. They need a transparent triage copilot that turns messy claim evidence into auditable, policy-aware reasons for where to look next.

### Hackathon judging target

Build for Carousell trust-and-safety reviewers, and optimize the demo around the judging criteria:

| Criterion | Weight | What the app must prove |
|-----------|--------|-------------------------|
| Proof of Work - Functionality | 25% | The end-to-end app runs locally, scores real seeded claims, streams/evaluates all claims, and exposes the scoring path without hand-waving. |
| Problem Fit + Market Value | 25% | Cash-refund abuse is a concrete marketplace fraud vector; the workflow maps to a real reviewer queue and reduces triage time without removing human judgment. |
| Design, Craft + Taste | 20% | The UI is dense, calm, and reviewer-grade: no gimmicks, no "fraud probability" language, clear evidence hierarchy, fast claim comparison. |
| Innovation + Sponsor Technology | 30% | OpenAI vision is used centrally for physical-plausibility reasoning, while deterministic signals and transparent aggregation prevent the AI from becoming an unaccountable black box. |

### Demo narrative

The strongest live demo path is:
1. Show the queue sorted by Risk Score.
2. Open a High claim caused by image reuse and show the pHash match, distance, and hard-flag override.
3. Open a Low legitimate claim and show why the system restrains itself despite visible damage.
4. Open the logistics cluster and show how behavioural risk is corrected by the order-level incident override.
5. Run `npm run eval -- --no-vision` to prove the deterministic spine works without OpenAI.
6. Run `npm run eval` to show OpenAI vision adds physical-plausibility explanations, not hidden final authority.

### Repo proof-of-work critique to address

The product spine is solid, but the repo workflow must prove the build, not merely describe it. The final project should make this statement hard to doubt:

> This exact build ran, these exact checks passed, and this exact demo is using the live scoring engine.

What is already strong:
- Clear human-in-the-loop thesis: risk triage, not auto-rejection.
- Locked dataset in `data/CANONICAL_DATASET.md`.
- Real backend signals: OpenAI vision, perceptual image reuse, behavioural context.
- Eval scripts exist, especially `apps/api/src/scripts/runFullPipeline.ts`.
- README honesty about what is out of scope.

Main proof gaps to fix before judging:
- Branch workflow is confused if docs say `master -> staging -> feature` while the default branch is `main`. Align docs and GitHub branch names.
- Add visible CI. At minimum, run install, typecheck, web build, API typecheck, and deterministic/pipeline eval on every PR or main push.
- Keep script names consistent. If package scripts expose `eval:pipeline` and `eval:signal1`, do not document `npm run eval -- --no-vision` unless that command exists.
- Fix deployment credibility. If Vercel imports `../apps/api/src/app`, the API must actually export `app`; split Express app construction from `server.listen`.
- Align login route names. The final workflow should use `POST /api/reviewer/login`; avoid a lingering `/api/seller/login` fallback unless clearly labelled as legacy.
- Add concurrency limits around full claim scoring so live demos do not fail from OpenAI rate limits or latency spikes.
- Make live-vs-demo mode unmistakable in the UI and README. Mock verdict fallback is acceptable as a backup, but the audience must know whether they are seeing live scoring.

First hardening tasks:
1. Add `.github/workflows/ci.yml`: install, typecheck, web build, API typecheck, `eval:pipeline`; optionally run full OpenAI eval when secrets are present.
2. Fix API deployment shape: export Express `app`, keep `server.listen` in `server.ts`, make Vercel import real code.
3. Implement or rename `/api/reviewer/login` so docs, frontend, and backend agree.
4. Add `PROOF.md` with demo URL, exact command sequence, latest passing eval output, dataset summary, live-vs-demo note, and known limitations.
5. Add visible live/demo mode badges in UI and README.
6. Add a scoring concurrency limiter for batch verdict loading and eval/demo runs.

Blunt product direction: do not add more product scope until the evidence chain is impossible to miss. For a proof-of-work hackathon, visible verification beats another feature.

### Current eval regression to fix

When `npm run eval:pipeline` is run against the read-only reference repo without working OpenAI vision, the pipeline drops the VisualClaimIntegrity signal and seven behaviour-only claims incorrectly become High:

`C001`, `C003`, `C006`, `C013`, `C015`, `C017`, `C018`

That violates the canonical calibration principle: **High requires a hard signal**. A risky account plus a plausible or unavailable visual signal should route to **Elevated**, not High. Fix by making the deterministic/eval path preserve this rule:
- BehaviouralContext alone must not force High.
- Missing VisualClaimIntegrity must not inflate the score.
- Clean ImageReuse with very low confidence must not distort the denominator enough to over-amplify BehaviouralContext.
- Hard flags from ImageReuse or high-confidence Visual implausibility can still force High.

Add this as an explicit regression gate in CI and `PROOF.md`.

### Why cash refunds specifically

Under Carousell's refund policy, a full refund with return is processed only after the item is returned to the seller in the right condition. Fraudsters who received an intact product have weak incentive to return it because returning defeats the scheme. Instead they target **cash payouts**, especially partial refunds for single-item orders where delivery fees, platform fees, BNPL fees, and other buyer-incurred fees are not refunded and no item return is required as part of that resolution. This is the fraud vector: fake, recycled, or AI-generated damage photos → cash payout → keep the item.

### Carousell scale assumptions

Design the product as if it sits in front of Carousell's existing post-purchase support pipeline:
- Claims are webhook-fed from platform order/refund systems, not typed manually by reviewers.
- The same triage concept must work for individual sellers, buyer-shop/direct-sales purchases, Buyer Protection, Certified, tracked mail, untracked mail, meet-ups, and cart orders.
- Marketplace context matters: a claim can be an item-quality issue, a seller fulfilment issue, a logistics incident, a policy-ineligible complaint, or a high-integrity-risk cash-refund attempt.
- Meet-ups are not the only deal method; do not design the app as a meet-up dispute tool.
- The seeded hackathon dataset is intentionally small, but the UI and backend should read like a scalable internal Carousell reviewer queue.

For the hackathon, the live data source is the local JSON dataset from `data/*.json` and images from `data/images/**`. Treat `https://github.com/onepang04/openai-x-sea-hackathon-group-14` as a **read-only reference repository**. Do not edit that repo. Use it only as source context for data shape, canonical claims, and existing documentation.

---

## Carousell Refund Policy — Triage Context

This policy section is the source of truth for product reasoning. Ground explanations in Carousell Singapore's Buyer Protection and Certified Refund Policy. If the implementation needs to simplify policy for the demo, simplify visibly and do not invent rules.

### Transaction surfaces to support conceptually
- **Buyer Protection marketplace orders**: shipped or meet-up orders with dispute windows.
- **Certified orders**: longer dispute windows and Certified-specific exclusions such as private viewing / meet-up deals for Certified Luxury.
- **Buyer-shop / direct-sales style purchases**: legitimate shop-like transactions on Carousell where buyers purchase through Carousell and post-purchase refund policy still applies.
- **Cart orders**: full whole-cart refunds differ from single-item refunds and partial refunds.
- **Tracked mail, untracked mail, and meet-ups**: each has different dispute-window timing.

### Eligible dispute reasons
- Item not received
- Incomplete item (missing parts/accessories)
- Item significantly not as described: wrong variation, missing parts, undisclosed damage, item extensively deviates from listing photo

### NOT eligible (flag these as low-integrity / ineligible)
- Subjective/non-significant variations (e.g. "light pink" vs "rose pink", "8/10" vs "6/10")
- Item listed as used, showing signs of wear
- Buyer changed mind / placed wrong order
- Buyer already received a separate refund not via Carousell
- Wrong delivery address provided by buyer
- Received after suggested delivery date (late but delivered)
- Claim for items not in the original listing
- Dispute raised after the dispute window
- Item stolen/damaged post successful delivery
- Packaging creases/dents only — item itself must be damaged
- Surface wear that doesn't affect functionality
- Gift bundles unless contents clearly described
- Meet-up / private viewing deals (Certified Luxury)

### Dispute window
| Programme | Tracked mail | Untracked mail | Meet-ups |
|-----------|-------------|----------------|----------|
| Buyer Protection | 2 days after delivery | 6 days after expected delivery | 13 days after confirmed meet-up |
| Certified | 7 days after delivery | 11 days after expected delivery | 13 days after confirmed meet-up |

### Refund payment timelines (narrator context only)
- PayNow: 24 hours · PayLah!: 2 hours · Debit/credit card: 5–10 working days · BNPL: check app

### Fee refund rules
- Full refund, whole cart: delivery fee, platform fee (4.5%), Carousell BNPL fee (5.5%), and other buyer-incurred fees are refunded
- Full refund, single item in multi-item cart: delivery fee is NOT refunded; platform/BNPL fees and other buyer-incurred fees are apportioned
- Partial refund, single-item order: delivery fee, platform fee, BNPL fee, and other buyer-incurred fees are NOT refunded

### Partial refund = higher risk
Partial refunds require no return under policy, making them the lowest-friction fraud path. Claims combining damage evidence with a partial refund request warrant elevated scrutiny.

### Full refund with return = different risk profile
A full refund is only processed once the seller confirms the return or receives the returned item. To be eligible for return, the item must be unused, in the same condition and packaging as received, with tags, free gifts, warranties, manuals, and accessories included where applicable. A buyer willing to return the item is not automatically legitimate, but the return requirement reduces the "keep item + get cash" fraud incentive.

### Policy-aware triage implications
- Damage to packaging alone is not enough unless the item itself is damaged.
- Surface wear that does not affect functionality is policy-ineligible or low integrity, not a High fraud signal by itself.
- Late delivery after the suggested delivery date is not enough if the item was received.
- Claims outside the dispute window are ineligible, but the demo dataset may not contain all timing fields needed to enforce this deterministically.
- Logistics clusters should be routed differently from per-buyer fraud: multiple damaged items in one shipped order may indicate transit or fulfilment failure.
- The narrator should distinguish "policy ineligible", "needs seller/logistics follow-up", and "integrity risk".

---

## Architecture

```
React + Vite + Tailwind  →  Node + TypeScript + Express  →  OpenAI vision (Signal 1)
Carousell reviewer dashboard   signal runner + aggregator       OpenAI narrator (text)
                                        |
                              in-memory JSON + images
```

No database. No ORM. No production auth. No buyer-facing UI. No manual claim input. No real Carousell integration.

---

## Tech Stack (do not substitute)

- **Backend**: Node.js + TypeScript + Express · `openai` · `sharp` · `imghash`
- **Frontend**: React + TypeScript + Tailwind · Vite
- **AI**: one `openai` client, two env-var model IDs:
  - `OPENAI_VISION_MODEL` — Signal 1 vision call
  - `OPENAI_NARRATOR_MODEL` — reviewer-facing prose (cheaper text model is fine)
  - `OPENAI_API_KEY` — auth for both

---

## Core TypeScript Types — build to these exactly (`apps/api/src/types.ts`)

```ts
export type ReasonCategory =
  | "damaged_or_faulty" | "wrong_product" | "incomplete"
  | "not_as_described" | "did_not_receive";

export interface Product {
  id: string; name: string; category: string; material: string;
  typical_failure_modes: string[]; price_sgd: number;
  reference_image?: string;
}

export interface Account {
  id: string; display_name: string; account_age_days: number;
  total_orders: number; total_refunds: number; claims_last_30_days: number;
  profile_note?: string;
}

export interface Order {
  id: string; account_id: string; delivery_date: string;
  items: number; total_claims_against_order: number; note?: string;
}

export interface Claim {
  id: string; account_id: string; product_id: string; order_id: string;
  reason_category: ReasonCategory; claim_text: string; images: string[];
  _dev?: { scenario_role: string; ground_truth: "legitimate" | "fraudulent";
           expected_band: string; why: string };
}

export interface EnrichedClaim { claim: Claim; account: Account; product: Product; order: Order }

export interface SignalResult {
  name: string; risk: number; confidence: number; // both 0..1
  evidence: string; raw?: unknown;
}

export interface ScoreContribution {
  signal: string;
  risk: number;        // 0..1
  confidence: number;  // 0..1
  weight: number;
  weightedNumerator: number;   // weight * risk * confidence
  weightedDenominator: number; // weight * confidence
}

export interface ScoreBreakdown {
  formula: string;
  contributions: ScoreContribution[];
  numerator: number;
  denominator: number;
  score01: number;
  hardFlagApplied: boolean;
  hardFlagReason: string | null;
  calibrationNote: string;
}

export type Band = "Low" | "Elevated" | "High";

export interface ScoredClaim {
  claimId: string; riskScore: number; // 0–100 whole number
  band: Band; hardFlag: string | null;
  signals: SignalResult[]; explanation?: string; recommendedAction?: string;
  breakdown?: ScoreBreakdown;
}

export interface Signal {
  name: string;
  evaluate(claim: EnrichedClaim): Promise<SignalResult>;
}
```

**CRITICAL**: `_dev` is demo ground-truth only. Strip it before any model call and before any API response. Never expose it in the UI. The UI may expose `breakdown`, signal `raw`, model IDs, and prompt version for explainability, but never `_dev`.

**Scale note, not part of the locked dataset contract**: production Carousell order data would likely include programme, fulfilment method, dispute-window deadline, cart id, refund type, payment method, seller/shop type, and return status. Do not require those fields for this hackathon dataset unless the JSON actually provides them. If added later, expose them as policy context and deterministic rules rather than hidden model assumptions.

---

## The Three Signals

### Signal 1 — Visual Claim Integrity (the star signal)

One OpenAI **vision** call per claim. Load the system prompt from `signal-1-prompt.md` on disk — do not inline a guess.

**System prompt** (load from file, reproduced here for reference):

> You are a claims-integrity analyst for an e-commerce marketplace. For each refund claim you receive a product (with its material and typical failure modes), the buyer's written claim, the reason category, and one or more photos. Your job is to assess whether the visible damage is (a) physically consistent with how that material actually fails, and (b) consistent with what the buyer says happened.
>
> Principles:
> - Be evidence-driven and cautious. Do NOT accuse a claim of fraud merely because damage looks dramatic — genuine damage can look alarming. Do NOT assume legitimacy merely because a photo is clear.
> - Fabricated damage often violates how materials physically break: cracks with no impact origin, fracture patterns impossible for the material (e.g. metal appearing to "crack" radially rather than dent), rendered-looking textures, lighting/edges that don't match the rest of the object.
> - Severity is not suspicion. A dramatic but physically coherent failure is plausible.
> - Judge against the MATERIAL given. Do not rescue a claim by inventing an unstated material or coating.
>
> Return observable, reviewer-auditable factors before the verdict: (1) visible damage features, (2) expected failure modes for this material, (3) contradictions, (4) plausible innocent explanations, (5) text-image match, (6) structured verdict. Do not rely on hidden reasoning; put the usable rationale in the JSON fields.
>
> Return strict JSON: `{ observed_damage_features: string[], expected_failure_modes: string[], contradictions: string[], alternative_explanations: string[], physical_plausibility: "plausible"|"implausible"|"uncertain", plausibility_reasoning: string, text_image_match: boolean, mismatches: string[], confidence: number }`

**Inputs to the vision call**: claim image(s), product `material`, `typical_failure_modes`, `claim_text`, `reason_category`.

**Map to SignalResult**:
- `risk`: plausible → ~0.1, uncertain → ~0.5, implausible → ~0.9
- `confidence`: from model's `confidence` field
- `evidence`: model's `plausibility_reasoning`
- `raw`: full parsed JSON (aggregator reads `physical_plausibility` and `confidence` from it)

**Hard flag**: `physical_plausibility === "implausible"` AND `confidence > 0.85`

**Reviewer-visible proof fields**: show `observed_damage_features`, `expected_failure_modes`, `contradictions`, `alternative_explanations`, `text_image_match`, and `mismatches` in an expandable "Visual reasoning" panel. This proves the model is not merely saying "suspicious"; it is comparing the claim against material-specific failure physics.

### Signal 2 — Image Reuse

`imghash` + `sharp` (64-bit pHash). Build a hash index at startup over:
- Every claim image → tagged `claim:<id>`
- Every product `reference_image` → tagged `reference:<productId>`

For a claim under evaluation, find minimum Hamming distance to (a) other claims' images and (b) the product's reference photo.

| Distance | Outcome |
|----------|---------|
| ≤ 5 | **Hard flag** (`raw.hardFlag = true`) |
| 5–8 | Elevated suspicion |
| > 8 | Clean |

`evidence` names what matched and the distance.

**Reviewer-visible proof fields**: show the nearest match target, source type (`claim` or `reference`), Hamming distance, threshold bucket, and whether `raw.hardFlag` fired. This is deterministic and should be easy for judges to verify from the seeded dataset.

### Signal 3 — Behavioural Context (deterministic, no API)

Heuristics over `accounts.json` / `orders.json`:
- `total_refunds / total_orders > 0.5` → +0.4
- `claims_last_30_days >= 3` → +0.4
- `account_age_days < 30` AND `product.price_sgd >= 50` → +0.2
- **Logistics-incident override**: if `order.total_claims_against_order >= 3` → this is a transit incident, not per-item fraud → pull risk down to `min(risk, 0.2)`, confidence 0.7

Clamp total to [0, 1]. `confidence = 0.7`. `raw = { refundRate, claimsLast30Days, accountAgeDays, itemPriceSgd, isLogisticsCluster, rulesFired }`.

**Reviewer-visible proof fields**: show the exact rules that fired and the override if present. Behavioural risk must never be presented as proof of fraud; it is only workload prioritization.

**Carousell-scale extension point**: if future JSON includes `programme`, `fulfilment_method`, `refund_type`, `cart_id`, `dispute_deadline`, `seller_type`, or `payment_method`, add deterministic policy checks before scoring:
- outside dispute window → policy-ineligible / request manual policy review
- partial refund + damage evidence → elevated scrutiny
- full refund with return pending → lower cash-out risk than partial refund
- cart-level refund → apply whole-cart vs single-item fee/refund context
- meet-up / private viewing Certified Luxury → policy exclusion context
- direct-shop/high-volume seller issue cluster → seller fulfilment or logistics queue, not buyer fraud by default

These extensions should appear as additional `rulesFired` entries and reviewer-visible proof rows, not hidden model assumptions.

**Run all three with `Promise.allSettled`** — a signal that throws is dropped, not fatal.

---

## Aggregation + Banding

```
weights: Visual 1.0, Image Reuse 0.9, Behavioural 0.7  (unknown signal → 0.5)
score01 = Σ(weight · risk · confidence) / Σ(weight · confidence)  // available signals only
riskScore = round(score01 · 100)

hardFlag fires if:
  Image Reuse raw.hardFlag === true
  OR Visual physical_plausibility === "implausible" AND confidence > 0.85
if hardFlag: riskScore = max(riskScore, 75)  // force into High band

bands:  < 30 → Low  |  30–65 → Elevated  |  > 65 → High
```

Missing signals drop from **both** numerator and denominator — absence is never penalised.

`recommendedAction`: Low → "Release for standard processing" · Elevated → "Request evidence" · High → "Escalate for investigation"

### Why these weights exist

The hackathon dataset is small, so weights are **declared calibration assumptions**, not claims of statistical truth:
- Visual = `1.0`: highest semantic value because it inspects the claim's core evidence against material failure modes.
- Image Reuse = `0.9`: near-highest value because exact/near-exact reuse is strong deterministic evidence, but pHash still needs reviewer context.
- Behavioural = `0.7`: useful triage context, but lower because account history alone should not condemn a specific claim.

With production data, tune weights on historical Carousell claims that have final reviewer outcomes, chargeback outcomes, return outcomes, seller disputes, and confirmed abuse labels. Optimize for reviewer workflow, not only raw accuracy:
- Keep false positives low for legitimate damaged-item claims.
- Measure precision/recall by band, especially High-band precision.
- Measure review-time reduction and escalation yield.
- Tune thresholds separately by product category and claim reason if enough data exists.
- Segment calibration by Carousell surface: Buyer Protection vs Certified, shipped vs meet-up, individual seller vs direct-shop style seller, single-item vs cart order, full refund with return vs partial refund.
- Recalibrate after policy changes, new fraud patterns, or seasonal category shifts.

For this hackathon, expose the current weights and formula in the UI and eval output. Do not pretend the weights were learned from a large proprietary dataset.

### Score breakdown contract

Every scored claim should include a `breakdown` object:
- `formula`: human-readable formula string.
- `contributions`: one row per available signal with risk, confidence, weight, numerator contribution, denominator contribution.
- `numerator`, `denominator`, `score01`.
- `hardFlagApplied` and `hardFlagReason`.
- `calibrationNote`: short text explaining that weights are hand-calibrated for the demo dataset and how they would be tuned with historical reviewer outcomes.

---

## Narrator — Final OpenAI Text Call

After aggregation, one text-only call produces a 2–4 sentence reviewer-facing explanation + recommended action. Must:
- Only reference signals that actually fired
- Name the band
- Never invent facts not in signal evidence
- Reference Carousell policy where relevant (e.g. partial refund = no return required)
- Use the score breakdown as source material but avoid implying mathematical certainty

**Resilience required**: wrap in try/catch with a templated fallback built from signal evidence. A narrator failure must never break a claim — it just swaps the prose. The Risk Score and band never depend on the narrator.

The narrator is not the decision-maker. It is a summarizer over already computed evidence. The UI must make this obvious by placing signal evidence and score math above or beside the prose explanation.

---

## API Surface (locked — build to this exactly)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/reviewer/login` | Demo reviewer login → session |
| `GET`  | `/api/claims` | Sanitized claim summaries for queue |
| `GET`  | `/api/claims/:id` | Sanitized enriched claim detail |
| `POST` | `/api/claims/:id/score` | Run full pipeline → `ScoredClaim` |
| `POST` | `/api/claim/:id/score` | Compatibility alias |
| `GET`  | `/api/verdicts` | All claims with scored verdicts |
| `GET`  | `/api/verdicts/stream` | Newline-delimited streaming load |

Strip `_dev` from every response.

---

## Reviewer Dashboard UI (`apps/web`)

**Login screen**: demo reviewer login only. No production auth, password reset, or registration.

**Dashboard (two-panel)**:
- **Left — claim queue**: list of claims with ID, product, band-coloured dot, risk score. Sorted by Risk Score descending by default. Search by claim ID / product / buyer. Filter chips: All / High / Elevated / Low.
- **Right — verdict card** for selected claim:
  - Large **Risk Score** (whole number, 0–100) + **Risk Band** — colour coded: High red / Elevated amber / Low green
  - Marketplace context strip: programme when known, fulfilment method when known, order/cart size, delivery date, refund type when known, and whether the case looks like buyer risk, seller fulfilment, logistics, or policy eligibility.
  - Claim evidence image(s) + product reference image side by side
  - Per-signal breakdown: three rows (VisualClaimIntegrity / ImageReuse / BehaviouralContext), each showing risk %, confidence %, one-line evidence. Hard flag badge when set.
  - Expandable **Proof of Work** panel:
    - Visual reasoning: observed damage, expected material failures, contradictions, alternative explanations, text-image match.
    - Image reuse: nearest match, match type, Hamming distance, threshold, hard-flag status.
    - Behavioural context: fired rules, refund rate, recent claims, account age, logistics-cluster override.
    - Score math: `weight × risk × confidence` rows, numerator, denominator, final score, hard-flag override.
    - Calibration note: why demo weights are hand-set and what production data would tune them.
  - Narrator explanation in plain prose
  - **Action buttons**: Release / Request evidence / Escalate — UI-only, logs decision locally, never auto-acts

Label the score **"Risk Score"** — never "Fraud Probability".

Dark theme. High contrast. Clean, dense, functional.

Design for reviewer trust:
- Do not hide all evidence behind a single generated paragraph.
- Do not use playful or consumer-app styling.
- Make Low claims feel intentionally cleared, not ignored.
- Make hard flags visually distinct from high behavioural risk.
- Make logistics/seller-fulfilment issues visually distinct from buyer-integrity risk.
- Make policy-ineligible claims distinct from suspected fraud.
- Use compact tables, disclosure panels, badges, and side-by-side image comparison.

---

## Canonical Dataset (18 active claims — locked)

`C002` and `C008` are excluded. Do not renumber.

| Claims | Product | Expected band | Star signal |
|--------|---------|--------------|-------------|
| C001, C003, C006, C013, C015, C017, C018 | various | Elevated | S3 behaviour only |
| C004, C007, C009, C014, C016 | various | **Low** | S1 restraint (false-positive anchors) |
| C005, C020 | skincare (P003) | **High** | S2 image reuse — same file across two accounts |
| C010, C011, C012 | container (P005) | **Low** | S3 logistics override (ORD-2010) |
| C019 | SSL 2 (P009) | **High** | S2 doctored-from-listing + S1 implausibility |

**Key structures:**
- C005 + C020 share `skincare_jar_cracked_closeup.jpg` across accounts A005 and A012 → hard flag
- C019's `ssl2_broken.jpg` is edited from `ssl2_intact.jpg` (P009's `reference_image`) → small pHash distance → hard flag
- C010/C011/C012 share order ORD-2010, `total_claims_against_order: 3` — account A010 looks risky but the override pulls cluster to Low

**Calibration principle:** High requires a hard signal. A plausible-photo fraud from a risky account is correctly **Elevated** — that's the "calibrated, not trigger-happy" thesis. Never force behaviour-only frauds to High.

**Make-or-break regression gate:** the 8 active legitimate claims and the C010/C011/C012 logistics cluster must land **Low**. Any regression there is a build-breaker.

---

## Eval Harness

Script at `apps/api/src/scripts/runEval.ts`, run via npm script.

Loads all claims, runs the full pipeline, prints:
```
claimId | expected band (_dev) | actual band | riskScore | hardFlag | topSignal | PASS/FAIL
```

The reference repo currently exposes these scripts:

```bash
npm run eval:pipeline   # current full pipeline script in the reference repo
npm run eval:signal1    # current Signal 1 vision tuning script
```

If the implementation claims to support a deterministic no-vision eval, add the script explicitly and keep docs/scripts aligned:

```bash
npm run eval:deterministic   # preferred: S2 + S3 + aggregation without OpenAI
npm run eval:pipeline        # full pipeline; uses OpenAI when env vars are present
npm run eval:signal1         # Signal 1 vision tuning eval
```

Do not leave stale runbook commands such as `npm run eval -- --no-vision` unless the package scripts actually implement them.

The eval must also print a proof summary:
- Total pass/fail count.
- High-band precision on the seeded expected labels.
- Count of Low legitimate claims that stayed Low.
- Count of logistics-cluster claims that stayed Low.
- Count of High claims caused by hard flags.
- A note when vision is disabled so judges understand what is deterministic.

Optional but preferred: write `artifacts/eval-runs/<timestamp>.json` containing sanitized scored claims, signal outputs, score breakdowns, model IDs, and prompt file hash. This creates a reproducible proof artifact for the hackathon demo.

### Ablation proof

Support these modes if time allows:
```bash
npm run eval -- --no-vision       # S2 + S3 deterministic spine
npm run eval -- --signals=s1      # vision-only explanation quality check
npm run eval -- --signals=s2,s3   # deterministic fraud/pathology checks
```

The goal is to prove OpenAI is central but not magical: deterministic safeguards still work, and the vision model contributes material-specific explanation rather than a hidden verdict.

---

## Environment Variables

```bash
OPENAI_API_KEY=sk-...
OPENAI_VISION_MODEL=<verify at venue>
OPENAI_NARRATOR_MODEL=<verify at venue — cheaper text model is fine>
```

Copy `.env.example` → `.env`.

---

## Scripts

```bash
npm install           # install deps
npm run dev           # start API (localhost:3000)
npm run dev:web       # start Vite frontend
npm run typecheck     # TS typecheck
npm run build         # production build of web app
npm run eval          # full pipeline eval
npm run eval:signal1  # Signal 1 vision tuning eval
```

---

## Build Sequence — STOP after each stage for review + commit

**Stage 0 — Scaffold.** Create `apps/api` (Node + TS + Express) and `apps/web` (React + Vite) skeletons, tsconfigs, package.jsons. Deps: api → `express cors openai imghash sharp`; dev → `typescript tsx @types/*`. Confirm both apps start. STOP.

**Stage 1 — Types + data layer.** Add `types.ts` exactly as specified. Loader for the four JSON files. Function that joins a claim into `EnrichedClaim`. Throwaway script to print all enriched claims to verify joins. STOP.

**Stage 2 — Deterministic spine (no API yet).** Implement Signal interface, BehaviouralContext, ImageReuse (hash index at startup), aggregator + banding + hard-flag, eval harness with `--no-vision`. Run `eval --no-vision` and report table. STOP.

**Stage 3 — Vision + narrator.** One `openai` client for both calls. VisualClaimIntegrity signal (load `signal-1-prompt.md`, strict-JSON parse with fallback). Narrator with templated fallback. Wire into pipeline. Run full eval and report expected vs actual. Include structured visual factors in `raw` for UI proof panels. STOP.

**Stage 4 — API.** Express endpoints matching the locked contract. Strip `_dev` from every response. Return `breakdown` and sanitized signal `raw` fields so the frontend can show proof-of-work details. STOP.

**Stage 5 — Reviewer UI.** Demo login + verdict-card dashboard against the API. Include the expandable Proof of Work panel and score math table. STOP.

**Stage 6 — Polish + demo.** Tighten styling, confirm hard-flag and Low legitimates read clearly, eval still green. Prepare the demo path: image reuse High, legitimate Low restraint, logistics override Low, terminal eval proof. STOP.

---

## Hard Rules — never violate at any stage

1. No AI-image detection. Physical-plausibility reasoning only.
2. No database, no ORM. JSON files in memory only.
3. Never auto-decide a claim. `ScoredClaim` and UI buttons are advisory; the Carousell reviewer acts.
4. Strip `_dev` before every model call and every API response.
5. Read both model IDs from env vars at runtime — do not hardcode guesses.
6. Commit after every stage. Keep diffs small.
7. If a contract is ambiguous, stop and ask — do not invent a new data shape.
8. Do not build a manual claim input form.
9. Do not present the score as statistically calibrated production truth. Explain that demo weights are hand-calibrated and would be tuned with historical reviewer outcomes.
10. Do not hide score math from the reviewer. The hackathon proof depends on auditability.

---

## Branching Workflow

```
main  ←  staging  ←  feature/<name>
```

- Work on `feature/<your-name>` branches cut from `staging`
- PRs target `staging` for integration
- `staging` → `main` only when demo-ready
- 3 contributors — teammates run: `git fetch origin && git checkout -b feature/<name> origin/staging`

---

## Reference Files (in `openai-x-sea-hackathon-group-14/`)

| File | Purpose |
|------|---------|
| `AGENTS.md` | Authoritative build constraints for Codex |
| `CONTEXT.md` | Domain vocabulary + Carousell refund policy detail |
| `signal-1-prompt.md` | Signal 1 system prompt — load from disk, never inline |
| `data/CANONICAL_DATASET.md` | Locked dataset — single source of truth |
| `data/IMAGES_MANIFEST.md` | Exact image filenames and scenario roles |
| `claim-integrity-agent-spec.md` | Full product/spec overview |
| `codex-build-plan.md` | Event-day ops runbook |
| `docs/frontend-ui-plan.md` | Reviewer dashboard design and QA notes |
