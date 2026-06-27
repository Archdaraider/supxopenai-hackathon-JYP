# OpenAI Physical Plausibility

The backend uses OpenAI only when `OPENAI_API_KEY` is configured.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
```

The model receives:

- claim image
- buyer refund description
- seller response
- product material
- typical product failure modes

The model must return structured JSON with:

- `score`: 0-100, where higher means less plausible or more reviewer scrutiny needed
- `confidence`: 0-1
- `plausibility`
- `observed_damage`
- `reasoning`
- `limitations`
- `recommended_reviewer_action`

This signal is advisory. It is capped at 15% of the final score and cannot alone produce `High`.
