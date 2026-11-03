# Validation record

Date: October 27, 2026.

## Light/dark theme follow-up — November 3, 2026

Added the header moon/sun button and Profile → Appearance control. The theme bootstrap runs before the stylesheet and uses browser local storage, with same-origin tab synchronization. All 21 existing automated tests and the Worker build pass. Browser checks verified dark mode, persistence through reload, toggling from the profile menu, dark native form/report controls and 390 × 844 phone layout without horizontal page overflow. Light mode remains the initial default for a browser without a saved preference.

## Profile follow-up — November 3, 2026

Added a profile landing page, activity/history filters, local display-name editing, saved-filing archive, preferences/help pages and a period-picker/report-preview flow with CSV downloads. All **21 tests pass**, including browser-storage corruption handling, retention bounds, date/type filters and spreadsheet-formula escaping. The Worker build includes the browser state module as a served ES module.

Browser checks verified the initial empty state, display-name editing, actual save/read/open/research events, research filtering, persistence after reload, and opening a saved filing after shortening the digest window to one hour. At 390 × 844, the profile had no horizontal page overflow. An actual seven-day activity CSV downloaded successfully and contained the verified TCS research and saved INFY filing actions. No test activity is embedded in the deployed app: activity is created and stored by each browser session.

## Interface refresh — November 3, 2026

Matched the user's two supplied interface references with a white holdings layout and a dark chart detail view. The existing 17 automated checks and Worker build pass. The digest now includes bounded closing-price history for chart rendering, drawn from the same bars as its price signals.

Local browser checks at desktop and 390 × 844 phone sizes verified all 18 holding rows, change-based sorting, rupee-change display, the five-session chart range, saved filing state, a 72-hour digest window, and header search returning cited TCS research. Mobile research measured 375 CSS pixels of document width in the 390-pixel viewport, with no horizontal page overflow. The supplied screenshots guide the visual design; FINN keeps its own branding and does not implement brokerage orders.

## Automated verification

`node --test tests/*.test.mjs`: **17 passed, 0 failed** after correcting whitespace normalization for symbols ending in `.NS`.

`node scripts/build.mjs`: succeeded. Produces an ESM Worker containing UI assets, API handler, compact source snapshot and PDF parser. Runtime behavior is shared with the Node server; there is no separate static-only demo backend.

Local server readiness: `/api/health` returned HTTP 200 with `ok: true`, four research tickers, 13 primary documents and `modelConfigured: false`.

## Real-provider integration results

| Adapter | Observed result |
|---|---|
| Yahoo chart / ASIANPAINT | 63 daily bars returned; last completed bar October 26, 2026, close ₹2,322 and volume 845,552 |
| NSE corporate announcements / INFY test filter | Request completed and returned no matching records; this is not proof of complete exchange coverage |
| Screener directory + primary PDF / LTFOODS | Unseeded ticker discovered; 18-page earnings-call transcript parsed into 38 passages |
| LTFOODS annual report | Explicit size-limit notice; no invented annual-report answer |
| Direct Infosys-hosted historical files | HTTP 403 in collection; exchange-filed copies used for the curated historical example |
| OpenAI synthesis | **Not run**: no API key supplied. Output validation is unit-tested; a real provider response is not verified |

Public endpoint behavior can differ by host, time and provider throttling. A successful integration test is not an availability guarantee. Live failures remain visible and do not trigger scenario-data substitution.

## Interface and hosting

The initial isolated-network browser visit timed out. Restarting the local server through the approved external-network path made the ordinary HTTP preview reachable. No browser-policy bypass was attempted.

The local browser rendered FINN at desktop size and at an explicit **390 × 844** phone viewport. Verified interactions:

- Marking a filing read reduced the material-unread count; saving changed its pressed state.
- A 72-hour window selected correctly and exposed additional older filings.
- The result scenario opened a modal with all four metrics and QoQ/YoY arithmetic.
- The historical guidance check rendered both references; S1 opened the correct quote and PDF page 4 link.
- Setting price to 10%, volume to 3×, and disabling capex left exactly one price/volume signal and moved the capex filing into the collapsed archive.
- TCS research returned cited annual-report and transcript notes through the form on mobile.
- The phone brief's document width was 375 CSS pixels within a 390-pixel viewport: **no horizontal page overflow**.

Screenshots of the mobile brief and evidence dialog accompany the delivered archive. The temporary viewport override was reset after testing. The final attempted portfolio-screen check was interrupted by the browser session becoming unavailable; no success is claimed for that specific check.

Native Sites deployment reported **succeeded**. Browser access to the deployed URL reached its expected owner-private sign-in gate; that gate requires the user's ChatGPT login. This verifies the access gate, not authenticated hosted UI behavior. No private credentials were entered by the agent.

## Known verification limits

### Holdings logo update — November 3, 2026

- All 21 existing tests passed. Frontend syntax and Worker build passed.
- All 18 bundled logo routes returned HTTP 200, `image/webp`, and bytes identical to the source asset files.
- The browser loaded all 18 logos successfully. Every Holdings subtitle contained only its allocation percentage.
- Inspected light and dark themes at 390 × 844 and the normal desktop viewport. No horizontal page overflow. Company marks preserve their original colors on white tiles.
- Screenshots: `screenshots/FINN-company-logos-dark.png` and `screenshots/FINN-company-logos-light.png`. Temporary viewport override reset after checks.

- Browser notification permission and actual notification delivery were not tested.
- Docker/Render configuration is supplied but not deployed or exercised here.
- Worker-specific PDF parsing for a new ticker should be exercised separately from Node parsing; large PDF memory/CPU limits can differ.
- No independent semantic-entailment evaluation for AI claims, and no claim of full financial diligence.

### Signal and filing logos — November 3, 2026

- Browser verified both Portfolio signal logos, all six material filing/price-card logos, and all four radar logos loaded from local assets.
- Inspected desktop dark mode and 390 × 844 light mode: filing headers fit, with no horizontal page overflow. Frontend syntax and Worker build passed.
- Evidence screenshots: `FINN-signal-logos.png`, `FINN-filing-logos.png`, `FINN-filing-logos-mobile.png` in `screenshots/`.

### Mobile navigation — November 3, 2026

- At 390 × 844, top section tabs are hidden and the bottom navigation remains visible. Switching Explore → Holdings through the bottom navigation worked; no horizontal overflow.
- At 1280px, desktop section tabs remain visible and bottom navigation remains hidden. Worker build passed.
- Screenshot: `screenshots/FINN-mobile-bottom-navigation.png`.

### WhatsApp notification demo — November 3, 2026

- All 21 existing tests, frontend syntax and Worker build passed.
- Browser tested selecting WhatsApp, choosing daily delivery, saving filing-only topics, reloading and reopening Notifications: all choices persisted.
- Message preview reflected the daily/filing-only selection and explicitly stated it was not sent. Empty topics with WhatsApp selected were rejected.
- Inspected 390 × 844 in light and dark modes; no horizontal page overflow. Temporary viewport override reset. Screenshots: `FINN-whatsapp-profile.png` and `FINN-whatsapp-preview.png`.
- No message was sent, no phone number was collected, and no real WhatsApp integration or background notification service was added or tested.

### Portable submission snapshot

The portable source passed all 21 tests. Its Worker build also passed without the original Sites identity, using the already installed platform build binary. This check reused existing dependency packages; it is not a clean-install test. The deployed app source is unchanged.
