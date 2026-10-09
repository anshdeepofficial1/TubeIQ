<div align="center">

# 📈 TubeIQ

**YouTube channel intelligence based on real, current public API data — never invented analytics.**

![YouTube](https://img.shields.io/badge/YouTube-Data%20API-FF0000?style=for-the-badge&logo=youtube&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000?style=for-the-badge&logo=vercel)

[Live Website](https://ytengine.vercel.app/) · [Privacy](https://ytengine.vercel.app/privacy) · [Terms](https://ytengine.vercel.app/terms)

</div>

## New: 30-day Content Studio (v2)

Open [Content Studio](https://ytengine.vercel.app/studio) or select **Content Studio** in the premium redesigned dashboard. This review-first tool does **not** automatically change or publish YouTube videos.

**Workflow**
1. Connect your real channel using a YouTube @handle, a channel URL, or its UC channel ID. A competitor can also be connected; both use official **public** YouTube channel and up-to-50-recent-upload responses.
2. **Share your content in any format:** paste a Markdown table, copy-and-paste rows from Excel (tabs), paste CSV, type a dated/bulleted list, or enter one title/content idea in the manual-entry form. You **do not need a spreadsheet**. An optional, collapsed section also supports **.xlsx, .xls or .csv** upload (up to 5 MB / 150 rows, first Excel sheet read).
3. For natural-language messages rather than a table, choose **Understand with AI**: Gemini extracts the dates, old titles, revised titles or content ideas into editable rows. It must leave unknown values blank rather than inventing them. The creator confirms the column mapping/interpretation before use. Local checks identify duplicate wording, repeated upload dates and overlong titles.
4. Click **Review all with AI**. Four existing calendar rows per request are reviewed by Gemini with the real channel's recent public title/metrics sample and optional public competitor sample. Suggestions are editorial: **keep**, **improve**, **verify** or **insufficient evidence**. Where specific public video IDs are cited, TubeIQ validates them against the actual data it supplied to AI.
5. Open any entry to inspect the original date/title, your chosen new title, reasoning, and verified public video links. Keep your own title, accept a suggested alternate, or edit manually; **approval is always required**.
6. Export a reviewed **Excel workbook**: for Excel imports, the app re-reads the original workbook bytes and appends a separately named **TubeIQ Review** worksheet, preserving the source worksheets as separate tabs on a best-effort basis. Keep the untouched original file to preserve any unsupported advanced formatting/macros/features. If the spreadsheet parser is unavailable, export falls back to formula-safe CSV.
7. Optional **Save on this device** explicitly saves reviewed text locally to browser storage; it is **not** cloud sync. Clear local draft removes that stored copy. Import and export are otherwise performed in the browser.

**Evidence rules:** Sampled public video view/like counts are current totals, not historical first-day performance. Competitor private CTR/retention and audience behavior are not available. AI cannot verify a Gurbani speaker, specific shabad or quotation from titles alone; audio or a verified transcript is required for such claims. No “viral score,” predicted views, guaranteed publishing hour, or invented growth gap.

**AI data handling:** When you explicitly choose **Understand with AI**, the pasted freeform message is submitted through `/api/gemini` so Gemini can extract structured rows (not yet rewrite titles). When you later press **Review all**, selected old/revised titles, upload dates, optional notes and public channel samples are submitted for editorial recommendations. The original file itself is parsed locally and is not sent to the AI endpoint. Review results may be inaccurate; the creator must approve every final title.

**Requirements:** The same **`YOUTUBE_API_KEY`** and **`GEMINI_API_KEY`** server-side Vercel environment variables described below. No additional provider keys or cloud database are required for the current browser-session workflow. Full owner-only YouTube Studio CTR, retention, audience timing, persistent backend accounts and automated YouTube publishing are **not implemented**.

**Frontend:** `premium.css` supplies the shared dark plum/lavender/mint design system. `studio.html`, `studio.css`, and `studio.js` implement the responsive Content Studio. Excel parsing/writing uses a pinned, official [SheetJS Community Edition 0.20.3 browser build](https://docs.sheetjs.com/docs/getting-started/installation/standalone/). The official CDN must be reachable to open .xlsx/.xls files.

**Regression tests:** `npm test` runs channel analytics safety checks and Content Studio parsers, bilingual column mapping, CSV formula-injection tests, markup sanity and AI structured-response checks. These are local deterministic tests, not live YouTube/Gemini end-to-end verification.

---

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

This avoids use of `search.list` to enumerate videos (quota costs and daily allowances must be checked against current YouTube documentation). Sample coverage depends on video privacy/deletion, API limits and available metrics. The charts do not claim to be complete channel history. Data may be served with a short-lived CDN cache, so counts are current snapshots, **not live Studio telemetry**.

## Source structure

```
TubeIQ/
├── index.html       # Dashboard, charts and client-side statistics
├── premium.css      # Shared premium visual design
├── studio.html      # Channel-aware Excel title review workspace
├── studio.css       # Studio responsive layout
├── studio.js        # Spreadsheet processing, public channel research, AI review and export
├── studio-input.js  # Pasted tables, plain-language AI extraction, manual entry
├── legal.css        # Matching Privacy and Terms design
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
