# White-Label Client Deployments

Each client gets a **separate Vercel project** pointing to the same GitHub repo.
Only the environment variables differ — zero code changes needed.

---

## Client 1 — Samayapurathal Bankers (Default)

> The live production deployment at pawncalc.vercel.app

No env overrides needed. All brand fallback values in `src/config/brand.js` are
already set for Samayapurathal.

---

## Client 2 — Sri Ayyanar Finance

**Logo setup:**
1. Place `sri-ayyanar-logo.png` (the trimmed transparent PNG) into `frontend/public/`
2. The file is then served at `/sri-ayyanar-logo.png` by Vercel

**Vercel environment variables for this project:**

```
VITE_API_URL=https://your-backend.up.railway.app/api

VITE_BRAND_NAME=Sri Ayyanar Finance
VITE_BRAND_TAGLINE=ஸ்ரீ அம்பாள் டிரேடர்ஸ்
VITE_BRAND_TAGLINE_ALT=ஸ்ரீ அய்யனார் பைனான்ஸ் & ஸ்ரீ அம்பாள் டிரேடர்ஸ்
VITE_BRAND_LOGO=/sri-ayyanar-logo.png
VITE_GOLD_RATE=2
VITE_SILVER_RATE=4
```

**Vercel deploy steps:**
1. Go to vercel.com → New Project → Import same GitHub repo
2. Set project name: `sri-ayyanar-finance`
3. Add the env vars above under Project Settings → Environment Variables
4. Deploy → done. Same codebase, different brand.

---

## Adding a New Client

1. Create a new Vercel project from the same repo
2. Copy the env block above, change the `VITE_BRAND_*` values
3. Put the client's logo PNG in `frontend/public/<client-logo>.png`
4. Set `VITE_BRAND_LOGO=/<client-logo>.png`
5. Deploy
