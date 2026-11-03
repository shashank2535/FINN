# AI-assisted build history

Date: October 27, 2026. Tool: Codex desktop. This document is a development log written during the build, not a raw conversation export or a record of hidden model reasoning.

Theme follow-up, November 3, 2026: added a header moon/sun theme button and an Appearance control in Profile. Applied coordinated dark colors across the app, persisted the preference in browser storage and added same-origin tab synchronization. Verified switching, reload persistence, phone layout and dark research/report controls; no paid API or data-provider changes were needed.

Profile follow-up, November 3, 2026: the user supplied a profile/reports screenshot and requested their activity on entry. Added a dedicated avatar/Profile destination, local display-name editing, counters, a timestamped activity timeline, saved filings, research history, preferences and help. Built real report previews, period filters and CSV downloads for workspace data. Verified reload persistence and retention of a saved filing outside the digest window, tested CSV formula escaping and inspected an actual downloaded activity CSV. This profile stores local app activity and does not present invented bank balances, orders, account identity or tax statements.

Interface follow-up, November 3, 2026: the user requested Groww's visual style and supplied two screenshots after being asked for references. Updated FINN's shell, navigation, typography, colors, compact holdings list, sparklines and dark EOD chart dialog. Added row sorting, a price/change display control and functional company search. Kept research, disclosures, configurable rules and honest scenario labels. Closing-price chart history comes from the existing input bars, with no invented intraday candles. Checked desktop and phone layouts and retained the existing financial-rule tests.

## User request

The user supplied the main challenge PDF and reference glossary and asked: “solve this assignment”. Document instructions were treated as the brief for implementation, not as authorization to send the submission email.

## Decisions and work performed

1. Read all seven pages across the two PDFs. Identified the required mobile-first prototype, 15–20-company mock portfolio, three data-source categories, generalized research and submission materials.
2. Selected two focused workflows: prioritized portfolio changes and primary-source research. Chose a small browser UI with a shared Fetch API backend runnable in Node and a hosted Worker.
3. Implemented 18 mock holdings, separate scenario/live modes, timestamp windows, title-based filing triage, deterministic price/volume rules and an explicit routine archive.
4. Collected public exchange-filed reports/transcripts through Screener's document links. Direct Infosys-hosted files returned access errors; exchange-filed copies were used where available. No broker research or news entered pull research.
5. Verified document metadata and reduced the distributed snapshot to curated factual notes plus short, verified quotations. Retained source URL, page and original PDF hash. Full temporary report text was kept outside the distributed dataset.
6. Added a historical Infosys annual guidance check: January's final FY25 growth forecast versus April's completed-year growth result, using the same constant-currency basis. Distinguished percentage points from relative percent change.
7. Implemented generalized document discovery and PDF extraction for an arbitrary valid NSE ticker. Restricted document URLs and redirects to reviewed primary-source hosts; bounded size, page count, caches and request rates.
8. Added optional Responses API synthesis using official API documentation. Citation IDs, exact quotations and numeric tokens are checked. No paid API key was provided; real synthesis remains unverified.
9. Added automated tests. The first run found whitespace/suffix normalization ordering in ticker parsing; fixed the trim order. The corrected suite passed all 17 checks.
10. Exercised real providers. Yahoo returned 63 completed daily bars for ASIANPAINT. NSE returned a valid empty matching-record set for the selected test. LTFOODS discovery and parsing returned an 18-page transcript; its annual report exceeded the configured size limit and was reported as unavailable.
11. Built the Worker bundle, pushed its exact source to the private Sites source repository, and deployed successfully. The hosted URL presented the expected private sign-in gate.
12. After moving the local preview server to the approved network path, checked the actual UI at desktop and 390 × 844 phone sizes. Exercised read/save, digest windows, rules, result modal, source citations and TCS research; captured the mobile brief and evidence dialog. The last portfolio check was interrupted by browser-session loss and is not claimed as verified. Final verification is recorded separately in VALIDATION.md and DEPLOYMENT.md.

## Build constraints and corrections

13. Removed ticker subtitles from all 18 Holdings rows, retaining company names, allocations, chart links and internal ticker identifiers. Added original company logos as local assets with source attribution. Verified every bundled logo response, all 21 existing tests, browser image loading, and the phone layout in both themes.

- Local command network calls needed the environment's external-network approval path. Approval was handled by the tool review flow.
- The bundled Sites installer expected npm, which was unavailable on PATH. Used the supplied pnpm runtime; allowed esbuild's setup and omitted unnecessary canvas builds.
- Kept source collection failures explicit rather than using invented documents or company facts.
- Did not run subagents, submit email, fabricate a GitHub repository URL or claim that this log is the requested full chat export.

## Required original conversation artifact

For the submission's AI-build-history requirement, attach the **actual Codex conversation export/share link** from this chat in addition to this log. Review it for private paths, account details or other information you do not want to share. This task did not automatically create a public share link for the conversation.

## WhatsApp prototype preference

Added Profile → Notifications with a selectable, browser-local WhatsApp demo, delivery/topic choices and a message preview. Kept demo status explicit and did not add real messaging, phone-number collection, or scheduled checks. Explained that the existing notification mechanism polls Live mode every 60 seconds only while the tab is visible.
