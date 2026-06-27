# Scoring

The reviewer tool combines four signals:

| Signal | Weight | Purpose |
|---|---:|---|
| Behavioural context | 40% | Account age, profile badge, refund rate, claim velocity, seller context, order value |
| Sightengine genai | 35% | Pixel-based AI-generated or AI-edited image likelihood |
| Physical plausibility | 15% | OpenAI vision reasoning over product material, failure modes, claim text, and image |
| Evidence sufficiency | 10% | Missing packaging context, missing/weak images, incomplete dispute context |

Unavailable API-backed signals are excluded and marked `not_configured`. They are not treated as low risk.

When one or more API-backed signals are unavailable, the final output is marked provisional in the guardrails section.

Guardrails:

- Physical plausibility cannot alone produce `High`.
- Behavioural context cannot alone produce `High`.
- Sightengine high AI likelihood can strongly elevate risk, but still appears as evidence with limitations.
- A low Sightengine score is not treated as proof of authenticity. The OpenAI visual/physical signal also checks visible image anomaly cues, and mixed detector/model evidence is surfaced as a guardrail.
- Reviewer-facing language avoids absolute fraud claims.
