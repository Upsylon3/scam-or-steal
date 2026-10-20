# Architecture

## Overview

Scam or Steal is a client-rendered static web application with an optional Supabase backend. It has no frontend framework, bundler, server-side runtime, or package dependency installation step. GitHub Pages hosts the app, and GitHub Actions performs validation and maintenance tasks.

```text
Browser
  ├─ index.html
  │    ├─ UI, event handlers, listing management, local storage and rendering
  │    ├─ builtin-parts.js ─ broad PassMark CPU/GPU lookup values
  │    ├─ benchmark-data.js ─ curated, sourced CPU/GPU suite records
  │    ├─ scoring-engine.js ─ versioned performance calculation
  │    └─ config.js ─ optional Supabase project URL + public client key
  │
  └─ optional Supabase REST/Auth
       ├─ shared CPU/GPU parts and shared reference-PC setting
       └─ authenticated user's private listing collection
```

The diagram describes the current division of responsibilities, not an isolated security boundary: the browser receives and executes the JavaScript, and `config.js` is public.

## Runtime data flow

1. The browser loads `index.html` and its script dependencies.
2. The app reads listings, preferences, tombstones and cached data from `localStorage`.
3. The part picker combines built-in hardware records with local/custom or remote shared entries as available.
4. For each listing, the app resolves CPU/GPU scores, applies the selected profile and reference PC, and calculates performance/value fields for ranking and display.
5. UI views (Compare, Table, Versus, Add a PC, Settings, Admin) display the same saved listing collection with different sorting, filtering, or comparison functions.
6. If Supabase is configured, background sync can load shared data and, when signed in, reconcile the account's collection with local changes. Without Supabase, local listing workflows and backups still work.

## Main modules

### `index.html`

Owns the page markup, CSS, tab and form interactions, listing persistence, table/CSV export, display rendering, and the browser-side Supabase integration. Most application logic is currently inline in the HTML; the CI validation workflow extracts that inline script for syntax checking.

### `builtin-parts.js`

Provides a broad, searchable set of CPU Mark and G3D Mark values used when users choose hardware. The scheduled PassMark workflow regenerates this list from upstream CPU/GPU listing pages, with safety checks to avoid committing obviously incomplete or suspicious output.

### `benchmark-data.js`

Stores versioned, curated benchmark data with model names, aliases, scores, source URLs, and suite details. The current dataset includes PassMark CPU single-thread records and selected Tom's Hardware CPU gaming/application and GPU gaming suite data. Curated data is not the same thing as the broad weekly PassMark list.

### `scoring-engine.js`

Exposes `window.PVL_SCORING`, including `score(parts, reference, profile)`, a normalization helper, the current model version, and lookup helpers for supported datasets. It only compares scores within matching benchmark methods where source coverage permits. When the data does not support a curated comparison, it uses a consistent fallback rather than mixing incompatible scales.

The implementation returns component percentages, the blended workload index, benchmark method labels, evidence text, confidence, resolution/mode metadata, and an optional GPU-suite FPS estimate.

### `config.js` and `setup.sql`

`config.js` holds the public Supabase URL and publishable/anon key. `setup.sql` provisions shared parts, app settings, an admin-secret hash, the private user-listings table, row-level security policies, and administrative RPC functions. See [Deployment](DEPLOYMENT.md) and [Security](../SECURITY.md) before modifying either.

## Persistence and cross-device merge

- **Local preferences and listings:** browser `localStorage`.
- **Backups:** JSON export/import. Import is additive and de-duplicates known existing entries rather than replacing the current collection.
- **Optional signed-in accounts:** a single Supabase row per user stores the account's listing array. Row-level security should restrict reads and writes to the authenticated owner.
- **Listing identity:** listings use stable IDs and timestamps. Deletions use tombstones so deletions can be propagated to a second device; merges choose the newest version of each listing and preserve entries that exist on only one side.
- **Shared reference and parts:** intentionally common data, used to provide a common default yardstick and hardware lookups. Admin operations use protected database functions.

This approach allows the static app to remain useful even if accounts are not configured, while acknowledging that local data does not follow users between devices unless they sync or transfer a backup.

## Scoring concepts

The project deliberately separates three concepts:

- **Performance index:** CPU and GPU performance relative to the selected reference PC, blended according to the selected workload.
- **Value index:** a component-cost-share model reflecting CPU, GPU, RAM and storage, optionally adjusted by appearance.
- **Performance/value per currency:** a ratio against the listing's effective price, after any entered setup deduction.

The UI's normalized Value / 100 is relative to the current collection. It is not the same as a fixed benchmark percentage. Full formulas, weights, data sources, fallback rules, confidence levels and estimate limitations are documented in [SCORING-MODEL.md](../SCORING-MODEL.md).

## Automated checks and maintenance

| Workflow or script | Responsibility |
| --- | --- |
| `validate-static-app.yml` | Checks inline JavaScript syntax, curated data structure, and scoring regressions on pushes and pull requests to `main` |
| `check-benchmark-data.js` | Flags invalid scores/dates, missing HTTPS sources, empty suites, and alias collisions |
| `update-parts.yml` + `update-parts.mjs` | Refreshes the broad PassMark parts list weekly with safety checks |
| `supabase-keepalive.yml` + `supabase-keepalive.mjs` | Periodically checks the configured Supabase project and may restore it if configured to do so |
| `check-listings.yml` + `check-listings.mjs` | Daily: opens each saved leboncoin ad link and replaces listings whose ad is gone by a deletion marker in `user_listings` (synced accounts only; uses the service role key; bookkeeping in `link_checks`) |

## Extension guidelines

- Keep scoring code testable independently from DOM behavior.
- Preserve benchmark source URLs, aliases and methodology when editing curated data.
- Do not mix separate test suites, resolutions, rendering modes, or test benches.
- If benchmark coverage is missing, retain the fallback and indicate its evidence quality; never fabricate a suite result.
- Avoid destructive data migrations. Preserve IDs, timestamps, and tombstones when changing account sync.
- Keep secrets out of static client files and preserve row-level security for private account data.
