<div align="center">

# 📈 TubeIQ

**YouTube channel intelligence based on real, current public API data — never invented analytics.**

![YouTube](https://img.shields.io/badge/YouTube-Data%20API-FF0000?style=for-the-badge&logo=youtube&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000?style=for-the-badge&logo=vercel)

[Live Website](https://ytengine.vercel.app/) · [Privacy](https://ytengine.vercel.app/privacy) · [Terms](https://ytengine.vercel.app/terms)

</div>

## What this application actually measures

TubeIQ reads official YouTube Data API v3 responses for a public channel and up to **50 recent public uploads**.

- Public subscriber count, lifetime channel views, and reported video count (where available).
- Mean of individual videos' **public like-count ÷ view-count** ratios. This is **not** the YouTube Studio engagement rate.
- Average public views, likes and comments per sampled video where those counters are available.
- Publishing intervals, the most common video category and category distribution of sampled uploads.
- Upload-month groupings based on **current** video statistics, not historical monthly channel views.
- Public sample comparisons and downloadable, explicitly labeled snapshot CSV.
- Optional owner sign-in via Google Identity Services with read-only YouTube OAuth access.
- Optional Gemini-generated **editorial drafts**. No AI-predicted view counts, guaranteed rankings or fabricated upload times.

**Unavailable is not zero.** If public metrics are missing, TubeIQ shows an em dash or explains the missing coverage. YouTube Studio-only metrics — CTR, watch time, retention, impressions, revenue and geographic audience trends — are not available from these public endpoints.

## Deployment (required)

TubeIQ uses Vercel Serverless Functions in `api/youtube.js` and `api/gemini.js`. **Opening `index.html` directly or deploying as static files will not provide the API routes.**

1. Import this repository into [Vercel](https://vercel.com) as a project using the **Other** framework preset (no build command needed).
2. Go to **Project → Settings → Environment Variables** and set:
   - `YOUTUBE_API_KEY`: a YouTube Data API v3-enabled key, with its API usage restricted to YouTube Data API v3.
   - `GEMINI_API_KEY`: a **different** Gemini API key from Google AI Studio, if you want AI.
   - `GEMINI_MODEL` (optional): defaults to `gemini-2.5-flash`. Configure a model currently available to your account.
3. Redeploy the Vercel project after setting the variables.
4. Enable the **YouTube Data API v3** in the Google Cloud project behind the YouTube key.
5. Set authorized JavaScript origins for the Google OAuth client to include the deployed HTTPS domain(s), so optional owner sign-in works.

Google OAuth client IDs are intended to be public and remain in the browser. **Google API keys and Gemini API keys must never be placed in HTML or committed to Git.**

### Important: rotate the previously exposed key

An older version of `index.html` included a Google API key in public Git history, including a split/concatenated variant. **Immediately revoke or rotate that key in Google Cloud Console**, create separate new YouTube/Gemini credentials, and configure Vercel. Merely deleting a secret from the newest commit cannot remove historical copies or undo previous exposure.

### Local development

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

Use `http://localhost:3000` for local testing, and add that origin to OAuth settings if you are testing Google sign-in locally. Never upload `.env.local`.

## Data methodology

1. Resolve a channel ID from a UC ID, @handle or standard YouTube channel URL.
2. Read the channel's official uploads playlist ID via `channels.list`.
3. Retrieve up to 50 recent uploads via the inexpensive `playlistItems.list` endpoint.
4. Fetch their public `videos.list` metadata/statistics in one batch.
5. Compute only labeled, reproducible summaries from actual available fields.

This avoids the 100-unit `search.list` call previously used to enumerate videos. Sample coverage depends on video privacy/deletion, API limits and available metrics. The charts do not claim to be complete channel history. Data may be served with a short-lived CDN cache, so counts are current snapshots, **not live Studio telemetry**.

## Source structure

```
TubeIQ/
├── index.html       # UI, charts, client-side statistics from API responses
├── api/
│   ├── youtube.js   # Restricted, read-only YouTube gateway (server-side key)
│   └── gemini.js    # Gemini editorial/chat endpoint (server-side key)
├── privacy.html
├── terms.html
├── Logo.png
├── .env.example
└── vercel.json
```

## Responsible usage

- Google's API quotas still apply; unrestricted public deployments should add a durable rate limiter and request monitoring before heavy traffic.
- Google sign-in accesses only the `youtube.readonly` OAuth scope and owner-channel discovery.
- The optional AI feature receives the channel statistics and text included in its prompts. Do not submit private information in AI chat.
- Creative recommendations are proposed drafts, **not independently validated performance forecasts**.

---

<div align="center">
Built by <a href="https://github.com/anshdeepofficial1">Anshdeep Singh</a>
</div>
