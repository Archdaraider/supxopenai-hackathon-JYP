# Claim Integrity Context

Shared domain language for the claim-integrity demo. This glossary defines product and workflow terms only; implementation details live in the build docs.

## Language

**Carousell Reviewer**:
An internal Carousell user who reviews buyer refund claims using the triage system.
_Avoid_: Seller, merchant, operator

**Buyer**:
The marketplace customer who submitted a refund claim after receiving an order.
_Avoid_: Account, customer account, claimant

**Refund Claim**:
A buyer's request for a **monetary (cash) refund** back to their original payment method, including claim text, reason category, evidence images, and order/product context. This system targets cash refund claims only — not return logistics or exchange requests.
_Avoid_: Ticket, dispute, return request

**Claim Triage**:
The advisory assessment of a Refund Claim into a Risk Score, Risk Band, per-signal evidence, and recommended next action.
_Avoid_: Fraud decision, adjudication, auto-denial

**Risk Score**:
A whole-number 0-100 ordinal score that ranks claim-integrity risk for triage.
_Avoid_: Fraud probability, fraud score, confidence score

**Risk Band**:
The Low, Elevated, or High category derived from the Risk Score.
_Avoid_: Verdict, decision, fraud label

**Webhook-Fed Claim**:
A Refund Claim made available to the system from Carousell platform data rather than entered manually in this product.
_Avoid_: Manual input, reviewer-created claim, form submission

---

## Carousell Refund Policy — Key Facts for Triage Context

The following is the operative Carousell (Singapore) Buyer Protection and Certified Refund Policy.
Use this to ground the narrator explanation and the BehaviouralContext signal in real platform rules.

### Eligible Dispute Reasons

A buyer may raise a dispute for:
- **Item not received**
- **Incomplete item** (missing parts or accessories)
- **Item significantly not as described**, including:
  - Different variation (size, colour, model, version)
  - Incomplete or missing parts
  - Damaged or undisclosed defect(s)
  - Item received deviates extensively from the listing photo

### NOT Eligible for Refund (use to flag Low-risk or ineligible claims)

These scenarios are explicitly excluded under Carousell policy:
- Subjective or non-significant variations (e.g. "light pink" vs "rose pink", "8/10" vs "6/10", "palm-sized" vs "15cm")
- Item listed as used in "used condition" showing signs of wear
- Buyer changed their mind
- Buyer placed the wrong order by mistake
- Buyer already received a partial or full refund through a separate process not facilitated by Carousell
- Buyer provided incorrect or invalid delivery address
- Buyer received the item after the suggested delivery date (late but delivered)
- Claim for something not in the original listing or agreed terms
- Dispute raised after the dispute window has closed
- Item stolen or damaged post successful delivery
- Packaging with only creases, dents, or wrinkles from shipping — item itself must be damaged
- Surface wear and tear that does not affect functionality
- "Brand New" items reviewed case-by-case
- Gift bundles (hampers, goodie bags, mystery boxes) unless contents are clearly described
- Items purchased during private viewing or meet-up deals (Certified Luxury only)

### Dispute Window (when a claim is still actionable)

The window starts when the seller confirms the order and closes when the buyer marks complete or autocomplete triggers.

**Buyer Protection:**
- Tracked Mail: 2 days after delivery date
- Untracked Mail: 6 days after expected delivery date
- Meet-Ups: 13 days after confirmed meet-up date

**Certified:**
- Tracked Mail: 7 days after delivery date
- Untracked Mail: 11 days after expected delivery date
- Meet-Ups: 13 days after confirmed meet-up date

For mixed Buyer Protection + Certified cart orders, the Certified window applies.

### Refund Processing Timelines (for narrator context only)

- PayNow: within 24 hours
- DBS PayLah!: within 2 hours
- Debit/Credit card: 5–10 working days (Mon–Fri, excluding weekends and public holidays)
- BNPL: buyer checks their BNPL app

### Fee Refund Rules (for narrator context)

- **Full refund for whole cart order**: delivery fee, platform fee (4.5%), Carousell BNPL fee (5.5%), and all other buyer-incurred fees are refunded.
- **Full refund for a single item in a multi-item order**: delivery fee is NOT refunded; platform and BNPL fees are apportioned and refunded proportionally.
- **Partial refund for a single item**: delivery fee, platform fee, and BNPL fee are NOT refunded.

### Cash Refund vs Return — Why This System Focuses on Cash

Carousell processes monetary refunds back to the buyer's original payment method (PayNow, PayLah!, debit/credit card, BNPL). Under policy:
- **Full refund**: requires the item to be returned to the seller in original condition first.
- **Partial refund**: no return required — payout is issued directly.

**The fraud vector this system targets:** a buyer submits fake or doctored damage photos to claim a cash refund while keeping the item. Fraudsters have no incentive to return products — they received an intact item and want both the item and the money back. If forced to return, the fraud attempt fails naturally (they'd have to hand back the real product). This is why:
- The triage system focuses exclusively on **cash refund claims** (damage photos → monetary payout).
- Returns are out of scope — if a buyer is willing to return the item, risk is substantially lower.
- Partial refund claims with damage evidence are **higher risk** because no return is required at all.

---

## Triage Implications

The BehaviouralContext signal and the narrator should use the above policy to:
1. Flag claims for ineligible reasons (subjective variation, post-window, surface wear, etc.) as low-integrity / ineligible — these reduce the need for escalation.
2. Treat partial refund + damage evidence claims as higher risk than full refund claims (no return requirement removes the natural fraud deterrent).
3. Contextualize logistics incidents (late delivery ≠ fraudulent claim; shared-order cluster → transit incident, not fraud).
4. Never auto-deny. All output is advisory for the Carousell reviewer.
