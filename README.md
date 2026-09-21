# Sales pipeline & search performance dashboard

Reads your lead workbooks and a weekly SEO matrix **entirely in the browser**, unifies them
despite mismatched column names, and shows the result as a dashboard filtered by any period.
No server holds the data. Nothing is uploaded.

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

Sign in with any email and a 6+ character password (demo mode), then either drop the files in
`samples/` onto the page or press **Load sample data**.

---

## What you get

| | |
|---|---|
| **Import** | Drag several `.xlsx` / `.xls` / `.xlsm` / `.csv` files at once. Parsing runs in a Web Worker, so a large file never freezes the UI. |
| **Schema detection** | Sheets are classified by *content*, not name. Three or more week columns ⇒ SEO matrix. A name / company / email column ⇒ leads. |
| **Column mapping** | `Name` or `First Name`+`Last Name`; `Company`/`Company Name`; `Stage`/`Lead Stage`; `Source`/`Lead Source`/`Lead Type`; `Lead Status`/`Current Status`; `Lead Value`/`Annual Revenue`. Guessed matches are flagged in **Data sources**. |
| **Matrix unpivot** | Horizontal weekly columns (`3-Jul`, `10-Jul`, …) become one row per week for views, users, bounce rate, form/chatbot leads, backlinks and domain authority. |
| **Periods** | 7 days, 4 weeks, this month, 3 months, this year, 12 months, all time, or a custom range. Group by week / month / quarter / year. KPIs compare against the preceding window of equal length. |
| **Views** | Overview, Pipeline, Websites & SEO, Marketing channels, All leads, Data sources. |
| **Multiple pipelines** | Leads are tagged with a pipeline (business line) from a `Pipeline` column, the tab name, or the file name. Filter the whole dashboard to one, or compare them side by side. |
| **Multiple websites** | `tecnoprism.com` and `automationcoe.com` are tracked separately and charted on one axis so the gap between them is visible. Add more in `src/lib/segments.js`. |
| **Marketing channels** | Email, social, landing pages and tool spend each have a working parser and panels. They switch on the moment a sheet with the right columns is dropped, and say what those columns are until then. |
| **Table** | Virtualised — 60,000 rows render as fast as 60. Search, filter by file / stage / status, sort, export the filtered set to CSV or Excel. |
| **Persistence** | Parsed data is cached in IndexedDB so a refresh does not empty the dashboard. Set `VITE_PERSIST=false` on shared machines. |

## Sections

**Overview** is the one screen to open cold: a tile per subject area (each says *Not connected* rather than showing a zero when it has no data), the funnel as a flow with the drop-off between stages written out, where leads come from, every pipeline side by side, and a coverage strip showing where each subject actually has data against the selected period.

**Pipeline** breaks the funnel down by business line. **Websites & SEO** compares the two properties directly. **Marketing channels** holds email, social, landing pages and spend. **All leads** is the unified table. **Data sources** shows what each sheet was read as and which column matches were guesses.

## Adding a channel's data

Each channel is an ordinary table. Drop a sheet with these columns and the panel fills in — no configuration, no code change. Header wording is matched loosely, so `Emails Sent`, `Sends` and `Volume` all work.

| Module | Required | Optional |
|---|---|---|
| Email marketing | Campaign, Emails sent | Send date, Delivered, Opens, Clicks, Leads, Unsubscribes, Cost, UTM campaign |
| Social media | Platform, Impressions | Date, Posts, Followers, Engagements, Clicks, Leads, Spend |
| Landing pages | Page, Sessions | Website, Date, Conversions, Bounce rate, UTM source / medium / campaign |
| Tools & spend | Tool, Amount | Category, Owner, Billing cycle, Renewal, Seats |

Rates are derived for you: email CTR is against *delivered* (falling back to sent), engagement rate is against impressions, and every tool cost is annualised so a yearly licence and a monthly one sit in the same total.

To tag a lead sheet to a site or pipeline, add a `Website` or `Pipeline` column — an explicit column always beats the name-based guess.

## Commands

```bash
npm run dev        # dev server with HMR
npm run test       # 65 unit + integration tests
npm run lint
npm run build      # production bundle in dist/
npm run preview    # serve the built bundle
node scripts/make-samples.mjs   # regenerate samples/
```

---

## Authentication — read this before deploying

`VITE_AUTH_MODE` selects an adapter in `src/auth/adapters/`.

**`demo` (default)** — the sign-in check runs in JavaScript the visitor can read and edit.
It verifies nothing. It is a gate for demos and screenshots, **not security**.

**`api`** — credentials are posted to your backend, which must:

| Method | Endpoint | Behaviour |
|---|---|---|
| `POST` | `/auth/session` | `{ email, password }` → `200 { user }`, or `401` |
| `GET` | `/auth/session` | `200 { user }` if the cookie is valid, else `401` |
| `DELETE` | `/auth/session` | `204` |

Set an **httpOnly, Secure, SameSite=Strict** session cookie. No token is ever held in JS, so an
XSS bug cannot read the session. Rate-limit `POST` (the client already handles `429`).

To use Supabase / Auth0 / Cognito instead, write one more adapter with the same three methods
(`restore`, `signIn`, `signOut`) and register it in `src/auth/AuthContext.jsx`. Nothing else changes.

> `VITE_` variables are inlined into the bundle at build time and are public. Never put a secret in one.

---

## Deployment

```bash
docker build -t sales-seo-dashboard \
  --build-arg VITE_AUTH_MODE=api \
  --build-arg VITE_AUTH_API_URL=https://api.yourcompany.com .
docker run -p 8080:8080 sales-seo-dashboard
```

The image runs tests during the build, serves via nginx as a non-root user, drops source maps,
sets a restrictive CSP, immutable caching for hashed assets, and exposes `/healthz`.
If you set `VITE_AUTH_MODE=api`, widen `connect-src` in `nginx.conf` to your API host.

---

## Architecture

```
src/
  lib/            pure logic, no React — where the tests live
    dates.js        UTC-midnight dates, parsing, bucketing, range presets
    numbers.js      currency/percent parsing, locale formatting
    fieldMap.js     header → field matching (two-pass, columns claimed once)
    stages.js       stage normalisation
    seoMatrix.js    matrix detection + unpivot
    salesSheet.js   lead extraction, per-column day-first detection
    parseWorkbook.js  routes each sheet to the right parser
    exporters.js    CSV / xlsx builders
    storage.js      IndexedDB cache
  workers/        parse.worker.js — keeps parsing off the main thread
  auth/           adapters + context + sign-in screen
  state/          DataContext (dataset, import) · useDashboard (all derived figures)
  components/     primitives, shell, dropzone, date bar, virtualised table
  views/          the five sections; lazily loaded so sign-in skips recharts
```

Everything the views display comes from `useDashboard`, so no two panels can disagree about what
"this period" means.

### Decisions worth knowing

- **Dates are UTC midnight.** Spreadsheet dates carry no timezone; anchoring to UTC stops a row
  dated 1 Jul from becoming 30 Jun for anyone west of Greenwich.
- **Day-first is detected per column, not per row.** `03/04/2026` is ambiguous; one value with a
  first part above 12 settles the whole column. If nothing settles it, day-first is assumed and the
  Data sources screen says so.
- **Range presets anchor to the newest date in your data, not today.** A workbook ending in March
  still shows rows under "last 7 days".
- **Week columns without a year are read as a sequence.** `3-Jul`, `10-Jul` … `1-Jan` is a run that
  crosses a year boundary. Read cell by cell, January lands eleven months *before* November, which
  scrambles every chart and pushes the newest date into the future — making every "last N days"
  filter return nothing. `assignWeekYears()` rolls the year forward when the month goes backwards,
  then shifts the whole run so it never ends in the future. Headers that state their own year are
  left alone.
- **Undated leads are kept by default** when a period is active, with a toggle to drop them and the
  count stated on screen. Silently excluding them was the second most confusing thing about periods.
- **A backwards custom range is swapped, not obeyed.** Picking 30 June to 1 June shows June.
- **An empty period explains itself.** Instead of blank charts you get the reason and the dates your
  data actually covers, with one button back to all time.
- **"Past discovery" excludes Closed Lost.** Conversion counts Qualified + Proposal + Closed Won.
  Change `ADVANCED_STAGES` in `src/lib/stages.js` if your definition differs.
- **Stock vs flow metrics.** Views and leads are summed across a bucket; bounce rate is averaged;
  backlinks and domain authority take the last value, because summing a running total is wrong.
- **Undated leads are excluded when a period is active**, and the count is stated on screen rather
  than silently dropped.
- **Re-importing a file replaces its rows** rather than duplicating them; SEO weeks merge by date.

---

## Known limits

1. **Tests cover the parsing and date layers (65 tests), not the React components.** Add
   `@testing-library/react` and Playwright before treating the UI as regression-proof.
2. **Currency is a single global setting** (`VITE_CURRENCY`). A workbook mixing USD and INR will
   produce a meaningless total. There is no FX conversion.
3. **Column mapping is heuristic.** Guesses are flagged, and `remapSheet()` exists to correct them,
   but the override UI is not wired up yet — that is the next thing worth building.
8. **Channel lead counts overlap and are not deduplicated.** Someone who arrives from an email and
   then converts on a landing page is counted in both rows. Real attribution needs GA4 UTM
   stitching: a shared `utm_campaign` key across the landing page export and the lead sheet, joined
   on first or last touch. The `campaign` and `medium` fields are already parsed on both sides, so
   the data is there — the join is not written yet, and the Overview says so on screen rather than
   implying a clean split.
9. **Cost per lead divides annual stack cost by leads in the selected period**, which flatters short
   periods. Read it as a rough ratio, not a unit economic.
4. **No audit trail or access control.** Anyone who signs in sees everything they import; there are
   no roles, no server-side record of who looked at what.
5. **Files above 40 MB are rejected** rather than streamed.
6. **`xlsx@0.18.5` is the last npm release** of SheetJS; the project now publishes from its own
   registry. Pin deliberately and re-check before upgrading.
7. **No i18n.** Interface copy is English only.
