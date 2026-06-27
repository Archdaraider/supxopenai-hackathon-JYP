# Sightengine

The backend uses Sightengine only when these env vars are configured:

```bash
SIGHTENGINE_API_USER=
SIGHTENGINE_API_SECRET=
```

Endpoint:

```txt
POST https://api.sightengine.com/1.0/check.json
models=genai
```

The result is framed as **AI image likelihood**. Based on Sightengine's public docs, the `genai` model is pixel-based and should not be described as C2PA, SynthID, EXIF, or watermark provenance verification.

If keys are missing, the signal returns `not_configured` and is excluded from weighted scoring.
