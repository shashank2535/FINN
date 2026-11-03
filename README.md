# FINN — Know what changed

A mobile-first investor attention inbox and a primary-source research notebook, built for the ENAM AI Engineer Build Challenge.

Holdings now show each company's logo before its name and only its allocation beneath it. The same logos also identify companies in Portfolio signals, Explore filing and price/volume cards, and On the radar. All 18 original logo images are bundled locally for offline and hosted use; see [asset sources](ASSET_SOURCES.md).

Light/dark appearance: use the moon/sun button in the header, or Appearance in Profile. The selection is saved in this browser and shared with other open FINN tabs on the same origin. It is applied before the stylesheet loads on return visits. Holdings, research, profile/activity, forms and report dialogs all have dark styling; switching theme preserves an in-progress research question.

Interface update, November 3, 2026: the supplied Groww screenshots guide a white stock-app layout, pill tabs, a compact holdings summary, real-history sparklines, green/red changes and a dark EOD chart dialog. FINN retains its own name and research workflows. The default screen is Holdings; Explore opens the daily brief. Row sorting, price/change display and the header company search are interactive. Charts use up to 30 available completed EOD observations; replay histories remain explicitly synthetic.

Profile update: the avatar and the mobile Profile tab open a dedicated account-style workspace. It includes an editable local display name, activity counters/timeline, saved filings, research history, alert preferences, help and reports. The activity log records actual app actions and is retained in browser local storage (200 recent entries), without reconstructing older actions or syncing between devices. Saved filing details remain available when the digest window changes. Reports have date filtering, a preview and CSV export for activity, research history, saved filings or the current mock portfolio snapshot. They are workspace reports, not broker P&L or tax documents. The prototype does not claim bank accounts, orders or authenticated identity data in this profile.

Profile → Notifications includes browser-alert guidance and a WhatsApp demo preference. Visitors can save an on/off choice, signal-based or daily delivery, and filing/price topics in browser storage, then preview an illustrative message. This is UI only: there is no phone-number collection, WhatsApp provider, scheduled delivery, webhook, or message transmission. Browser alerts still depend on Live mode polling while the tab is visible.

**Point of view:** the useful unit is a change worth investigating, with a short path to its evidence. FINN starts with a prioritized brief, not an empty chat box.

## Try it

Node.js 22 or newer is required. No paid API key is needed. For a Worker build, use a full `npm install` so esbuild can install its platform binary; the Node app can run with optional packages omitted.

```sh
npm install --omit=optional
npm start
```

Open **http://127.0.0.1:4173**. Alternatively, with pnpm installed:

```sh
pnpm install --no-optional
pnpm start
```

The committed pnpm lockfile pins the dependency graph. The project has one runtime dependency (`unpdf`) and one build dependency (`esbuild`). The optional canvas package is unnecessary for text extraction. A prebuilt, self-contained Worker is also provided in the submission ZIP under `dist/server/index.js`.

The public prototype uses the same API and business rules as the local Node server. [Open FINN on a phone or desktop](https://finn-investor-brief-27.unknownmessiah49.chatgpt.site/?v=4c60891#portfolio). [GitHub repository](https://github.com/shashank2535/FINN). Deployment status and runtime limits are recorded in `DEPLOYMENT.md`.

## A three-minute demo

1. Open **Explore → Scenario replay**. Four material filing scenarios rank ahead of routine paperwork. Read a card, save one and open the collapsed filing archive.
2. Change **24h → 3d → 7d**, or enter a custom lookback from 1 to 168 hours. The filtering changes the underlying timestamp window, not just its label.
3. Open the quarterly-result scenario for Revenue / EBITDA / PBT / PAT and calculated QoQ / YoY changes. These are **illustrative figures**, not extracted company results.
4. Open **Your rules**. Set volume to 3×: the HDFC Bank replay signal drops below the volume threshold while Dixon remains above it. A price rule can independently retain a signal. Deselect a filing category and verify that the item moves to the collapsed archive.
5. Open **Explore the Infosys guidance check**. Final FY25 constant-currency revenue growth guidance was 4.5–5%; delivered growth was 4.2%, or 0.3 percentage points below the floor. Inspect both source references and open the PDF pages.
6. Open **Research**, select INFY / TCS / HDFCBANK / RELIANCE, and try a question chip. Every note or answer has a clickable evidence reference. These four companies have compact, dated primary-document snapshots.
7. Enter an unseeded NSE ticker such as **LTFOODS** and ask about revenue growth or cash flow. The same pipeline discovers source links, downloads exchange-hosted PDFs, indexes text and retrieves relevant passages. Availability and size limits are shown explicitly. This is not a lookup table restricted to the four demo companies.
8. Switch **Data → Live providers**. The app fetches Yahoo Finance daily bars and NSE corporate announcements. Each source failure stays visible. There is no silent substitution of scenario events or prices.

## What works

- Mock portfolio: 18 NSE-listed companies spanning banking, technology, industrials, consumer, healthcare, auto, utilities, materials and electronics; weights total 100%.
- Push: selected-window filing digest, category-based materiality rules, disclosed ranking reason, routine archive, read/save state and brief download.
- EOD rules: symmetric price thresholds and volume versus the **previous 20 valid sessions**, excluding the observation. No volume alert with an incomplete baseline. Current-day Yahoo bars are excluded until 16:00 IST.
- Foreground monitoring: in live mode, refreshes once per minute while the tab is visible. Optional browser notifications request permission only through the rules form. The first refresh establishes a baseline; subsequent new events can notify.
- Pull: primary-document discovery, bounded PDF text extraction, retrieval and page citations. A compact offline corpus includes 13 documents: annual reports and transcripts for four companies, plus historical Infosys guidance evidence.
- Optional AI: server-side OpenAI Responses API synthesis with strict JSON output; rejects unknown citation IDs, fabricated quotations and numeric tokens absent from cited source evidence/notes. If the provider fails, the app shows source notes/excerpts. These checks do **not** establish full semantic entailment.
- No-key mode: curated source notes for bundled companies, extractive source passages for newly fetched companies. The UI explicitly labels this as evidence mode, not generated analysis.
- Shared Node/Worker request handler, responsive layout, keyboard focus states, semantic forms, dialog evidence viewer, reduced-motion support and browser-local settings.

## Three data sources

| Source | Adapter | Used for | Important limits |
|---|---|---|---|
| Yahoo Finance chart API | `src/providers.mjs: prices` | EOD close and volume | Unofficial public endpoint, may throttle; bars are not a total-return series |
| NSE corporate announcements | `src/providers.mjs: filings` | Portfolio disclosures and source attachments | Session-cookie bootstrap, provider access/retention can vary; title classification is provisional |
| Annual reports and company transcripts | `src/providers.mjs: discover/loadPrimary` | Pull research | Screener is a directory only; downloads are exchange/company documents |

The live research allowlist permits BSE/NSE archive hosts and the four seeded companies' official IR hosts. For an arbitrary ticker, BSE/NSE documents are usable without adding its website. Reports hosted only on another IR domain require an explicitly reviewed allowlist extension. There is no arbitrary user-supplied URL fetch endpoint.

Primary-source metadata includes the original URL, PDF page index, retrieval timestamp and SHA-256 of the original downloaded PDF. **Retrieval time is not the document's financial period.** Titles preserve the period. The bundled corpus contains authored factual notes with one verified short quotation per source, not entire redistributed reports. A note is not a complete financial statement or a verbatim passage. Open the linked report to review context.

## Configure optional AI

Copy `.env.example` to `.env`, put your own key in `OPENAI_API_KEY`, and start the app. Never commit `.env`. Keep API keys on the server; the browser has no key-entry field. `OPENAI_MODEL` defaults to `gpt-4.1-mini` and can be changed to another Responses-compatible model supporting strict structured output. No API key was supplied during this build, so a real model call was **not** tested or billed.

Official API contract: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

Deterministic classification and arithmetic cost no model tokens. Only a question uses synthesis; each call retrieves at most six passages and caps output at 1,100 tokens. Cache keys include ticker, question, model and source document hashes. Caches are bounded in-memory caches, not shared or durable. All caches vanish on process restart or Worker eviction. No embedding database or vector service is required at this scale.

## Architecture

```text
Responsive browser UI
  ├─ brief / rules / portfolio → /api/digest
  │    ├─ Replay fixtures OR Yahoo daily bars + NSE filing adapter
  │    ├─ transparent priority rules + deduplication + time window
  │    └─ deterministic EOD signals
  └─ research → /api/research (POST)
       ├─ curated snapshot OR Screener link discovery → primary PDF
       ├─ bounded extraction → lexical retrieval + page identity
       └─ evidence notes/excerpts OR optional cited AI synthesis
```

`engine.mjs` contains pure rules and arithmetic; `providers.mjs` handles unreliable I/O; `research.mjs` contains retrieval/synthesis; `app.mjs` is a Fetch API handler used by both `server.mjs` and `worker.mjs`. No framework is needed for these four screens.

## Verification

```sh
npm test
npm run build
```

Twenty-one automated tests cover financial rules, source grounding, failure behavior, profile persistence, saved-filing retention, bounded activity, report filters and CSV safety. See `VALIDATION.md` for integration results and browser-verification status.

To inspect or refresh source discovery locally (optional maintenance, Python is **not** a runtime dependency):

```sh
pip install pypdf
python scripts/collect_sources.py
```

This writes a full temporary index under ignored `.cache/`, not into the distributed snapshot. `curate_snapshot.py` is a historical authoring helper whose fixed document hashes intentionally fail if the historical source set changes; inspect new reports and update the notes rather than treating old page references as valid for new content.

## Hosting

The Node app runs directly with `npm start`. A Worker entry point is also supplied. The original Sites project identity is omitted from this portable repository; the portable Worker build runs without it. Provide your own `.openai/hosting.json` when deploying a new Site.

For a Node host, install production dependencies and run `npm start` with `HOST=0.0.0.0` and the platform-provided `PORT`. Place it behind HTTPS/authentication before exposing a paid model key. The prototype's in-memory per-IP rate limit is a modest guard, not production abuse protection. See `Dockerfile` and `render.yaml` for a portable alternative.

## Deliberate limits and next steps

- No background scheduler, persistent ingestion log, mobile push service or delivery SLA. Notifications work only in an open, visible live tab.
- No OCR. Live PDFs are limited to 22 MiB and the first 100 pages per document to bound extraction memory. Large or scanned documents produce coverage notices. A production queue/object store and separate extraction workers are the next infrastructure step.
- No automatic extraction of quarterly result tables from arbitrary PDFs. The bridge is a clearly labeled scenario; banking EBITDA is not manufactured. Live filings link to their primary attachment.
- Management-transition scenarios do not invent a biography or scrape LinkedIn. A reviewed professional-background enrichment step would be added only with verified sources.
- No position valuation, brokerage integration or investment recommendations. Mock weights are not recommendations.
- The featured guidance check is one annual promise/outcome comparison, **not** a last-four-quarters scorecard. Expanding it needs period-, basis- and metric-matched structured extraction with human review.
- Keyword ranking and lexical retrieval are intentionally inspectable and imperfect. A compact extraction model, semantic reranker and adversarial evidence evaluation would be useful once a larger corpus justifies them.
- Corporate actions can mechanically affect unadjusted close changes. Live alerts are leads to investigate, not an assertion of economic causation.

## Submission package

`DEMO_GUIDE.md` is a reviewer walkthrough and `AI_BUILD_HISTORY.md` is a supplementary development log. The project writeup and original AI conversation export are supplied separately in the final submission pack.
