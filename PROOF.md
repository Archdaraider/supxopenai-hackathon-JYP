# Proof of Work

This repo is a Carousell internal reviewer demo for cash-refund claim integrity triage. The product is advisory: it ranks claims for human review and never auto-approves or auto-rejects.

## Demo Commands

```bash
npm ci
npm run typecheck
npm run build
npm run eval:deterministic
npm run eval:pipeline
```

Start the live demo locally:

```bash
npm run dev
npm run dev:web
```

API: `http://localhost:3000`  
Web: Vite's printed local URL

## What The Checks Prove

- `npm run typecheck`: API and web TypeScript contracts compile.
- `npm run build`: reviewer dashboard builds for production.
- `npm run eval:deterministic`: ImageReuse, BehaviouralContext, aggregation, hard flags, and the High-requires-hard-signal rule work without OpenAI.
- `npm run eval:pipeline`: full scoring path runs over all 18 active claims. If OpenAI env vars are absent, Signal 1 is dropped and scoring continues over available signals.
- `npm run eval:signal1`: optional OpenAI vision tuning eval when `OPENAI_API_KEY` and `OPENAI_VISION_MODEL` are available.

## Dataset Summary

Source: `data/CANONICAL_DATASET.md`

- 18 active claims.
- `C002` and `C008` intentionally excluded.
- High hard-flag cases: `C005`, `C020`, `C019`.
- Logistics override cases that must remain Low: `C010`, `C011`, `C012`.
- Behaviour-only frauds must remain Elevated, not High: `C001`, `C003`, `C006`, `C013`, `C015`, `C017`, `C018`.

## Live Engine vs Demo Mode

The dashboard has two paths:

- **Live API**: calls `/api/verdicts/stream` and scores seeded JSON claims through the backend.
- **Demo data**: uses local mock verdicts only as a fallback/presentation backup.

The UI labels the source in the header. The proof path for judges is the Live API path plus the terminal eval commands above.

## Known Limits

- No production auth, database, ORM, or real Carousell integration.
- The seeded dataset stands in for webhook-fed Carousell order/refund data.
- Weights are hand-calibrated for the hackathon dataset. Production tuning would use historical reviewer outcomes, return outcomes, seller disputes, chargebacks, confirmed abuse labels, and surface segmentation.
- Full OpenAI eval depends on current model availability and API credentials.

## Policy Guardrails

- Label the score as **Risk Score**, never "Fraud Probability".
- High requires a hard signal: image reuse, doctored-from-listing, or high-confidence physical implausibility.
- Behavioural context alone is workload prioritization, not proof of fraud.
- Logistics clusters and seller fulfilment issues should be routed differently from buyer-integrity risk.
