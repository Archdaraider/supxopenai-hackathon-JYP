# Runbook

Install backend dependencies:

```bash
cd reviewer-api
npm install
```

Install frontend dependencies:

```bash
cd reviewer-ui
npm install
```

Run the backend:

```bash
cd reviewer-api
npm run dev
```

Run the frontend:

```bash
cd reviewer-ui
npm run dev
```

Optional dataset dashboard:

```bash
python3 -m http.server 8080
```

URLs:

- Reviewer UI: `http://localhost:5173`
- Reviewer API: `http://localhost:3001/api/health`
- Dataset dashboard: `http://localhost:8080/dataset-dashboard.html`

API keys are optional during local development. Missing keys appear as `not_configured` signals.

When OpenAI or Sightengine keys are configured, also set a local reviewer token:

```bash
REVIEWER_ANALYZE_TOKEN=choose-a-local-token
```

Then start the frontend with the matching value:

```bash
VITE_REVIEWER_ANALYZE_TOKEN=choose-a-local-token npm run dev
```
