# Scam or Steal

**Compare used-PC listings by workload-aware performance, price, and value per euro.**

[**Open the live app**](https://upsylon3.github.io/scam-or-steal/) · [Project overview](docs/PROJECT.md) · [Scoring model](SCORING-MODEL.md) · [Deployment guide](docs/DEPLOYMENT.md) · [Architecture](docs/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

Scam or Steal is a lightweight, browser-based tool for deciding whether a second-hand PC listing is a good deal. Add the hardware and asking price, then compare listings using benchmark-backed performance estimates instead of relying on the model names alone.

It is a static HTML/CSS/JavaScript app: there is no build step or frontend framework. Listings are stored locally by default; optional Supabase integration adds shared part data and account-based sync across devices.

## Features

- **Rank listings.** Sort PCs by performance, value, price, CPU, GPU, RAM, or storage.
- **Choose a workload.** Compare balanced use, gaming, CPU-heavy/competitive gaming, GPU-heavy workloads, or CPU-heavy productivity.
- **Tune gaming comparisons.** Select 1080p, 1440p, or 4K and rasterization or ray tracing. Curated GPU results are used only when both GPUs have compatible source data.
- **See the evidence.** The table exposes CPU/GPU benchmark percentages, the method used, and evidence confidence. A GPU-suite FPS estimate is shown only when supported data exists.
- **Use a spreadsheet-style table.** Search listings, sort columns, filter by availability or favourites, and export the visible rows to CSV.
- **Compare two PCs directly.** The Versus view compares performance, effective price, and performance per currency unit.
- **Track listings.** Favourite options, mark sold/offline listings unavailable, filter to available listings, and optionally hide listings that are dominated by a more powerful option at a lower price.
- **Account for the extras.** Enter RAM type/capacity, SSD/HDD storage, appearance, and the value of an included monitor/peripheral setup. Unknown RAM and SSD details can be marked as assumptions.
- **Back up your data.** Export and import JSON backups. Import adds listings to the current collection; it does not replace or wipe it.
- **Keep data across devices (optional).** A Supabase account can sync your own listings. Shared component data and the default reference PC are also backed by Supabase when configured.

The optional listing-name field can hold an advert URL for your own reference, but the app does **not** currently scrape marketplace pages or import listings directly from adverts.

## Understanding the scores

Scam or Steal keeps performance and value separate because they answer different questions.

### Performance index

The performance index compares a listing's CPU and GPU with a reference PC (100% means equal to the reference under the selected model). Its result changes with the chosen workload.

- When compatible records exist, gaming profiles use Tom's Hardware's curated 2026 CPU gaming suite and resolution-/mode-specific GPU gaming suite.
- CPU-heavy productivity can use matched single-threaded and multi-threaded application-suite results.
- When the required curated records are unavailable, the model falls back to compatible PassMark ratios rather than mixing unrelated benchmark scales.
- RAM, storage and aesthetics are **not** components of the performance index.

### Value index

The value index is a separate estimate built from the hardware's share of the cost of a typical PC build, including CPU, GPU, RAM and storage, with an optional appearance adjustment. Value per currency unit divides this index by the effective price. An included setup's entered value is deducted from the asking price; the effective price is never allowed below one currency unit.

The displayed **Value / 100** is normalized against the best available listing in the current collection, so it is useful for comparing the listings you entered—not as a universal score that can be compared between different people's collections.

### Estimated GPU-suite FPS

When a GPU has curated data for the selected resolution and graphics mode, the app converts its multi-game suite index into the source's published geometric-mean FPS baseline. This is a **suite aggregate**, not a prediction for a specific game and not a guarantee for the complete PC. The source test system uses a Ryzen 7 9800X3D and excludes upscaling and frame generation; a slower CPU, game settings, drivers, cooling, VRAM capacity and other system limits can change real results. GPUs without appropriate suite data show no estimate.

Confidence describes how much matching benchmark evidence is available, not certainty about a particular used PC. Read the full methodology, profile weights, sources, and fallback rules in [SCORING-MODEL.md](SCORING-MODEL.md).

## Quick start

### Use the hosted app

Open [upsylon3.github.io/scam-or-steal](https://upsylon3.github.io/scam-or-steal/). Choose **Add a PC**, select its CPU and GPU, enter the price, and add any known RAM/storage details. Add the other listings you are considering and use **Compare**, **Table**, or **Versus** to evaluate them.

### Run locally

No package installation or build process is needed.

```bash
git clone https://github.com/Upsylon3/scam-or-steal.git
cd scam-or-steal
```

Open `index.html` directly in your browser. With the repository's `config.js`, the app can connect to its configured Supabase project. For a local-only/offline run, empty both values in `config.js`:

```js
window.PVL_CONFIG = { supabaseUrl: "", supabaseKey: "" };
```

When no Supabase connection is configured, listings, preferences, and custom local data remain in that browser's storage; account sign-in and shared data are unavailable.

## Data, privacy, and backups

- **Not signed in:** listings and preferences are stored in the current browser's `localStorage`. They are not automatically available on another device or browser profile.
- **Signed in (optional):** the user's listing collection can sync through Supabase. Database row-level security is intended to restrict each account to its own listing row.
- **Shared component data:** the Supabase-backed CPU/GPU part list and default reference PC are shared between visitors when connected. Visitors can read shared data and submit entries; privileged edits use the admin functions.
- **Backups:** Settings → Export backup downloads a JSON file. Import merges its listings into the current collection without deleting existing ones. Keep backups somewhere safe, especially because password reset is not implemented by the app.
- **Account setup:** Supabase Email confirmation should be switched off if you want the no-email confirmation flow described in [the deployment guide](docs/DEPLOYMENT.md).

The app is a static client, so `config.js` is visible to every visitor. A Supabase **publishable/anon** key is designed for client-side use only when database policies are correctly configured. Never put a Supabase `service_role` key, secret key, access token, or admin passphrase in `config.js` or any other committed client-side file.

## Benchmark data and maintenance

There are two different component datasets:

- `builtin-parts.js` is the broad PassMark CPU Mark / G3D Mark list used to select and score hardware. The GitHub Actions workflow attempts to refresh it every Monday.
- `benchmark-data.js` contains curated, explicitly sourced CPU single-thread, CPU gaming/application, and GPU gaming-suite records. It is versioned and maintained separately; it is **not** silently rewritten by the weekly PassMark sync.

When changing curated data, verify the exact hardware model, preserve aliases and source URLs, and compare values only inside the same benchmark suite, test bench, resolution, and graphics mode. Do not invent or interpolate missing FPS results. The [scoring model documentation](SCORING-MODEL.md) has the full rules.

## Repository map

| Path | Purpose |
| --- | --- |
| `index.html` | Application UI, listing management, storage/sync integration, and rendering |
| `scoring-engine.js` | Versioned CPU/GPU performance scoring logic |
| `benchmark-data.js` | Curated benchmark records, aliases, sources, and dataset version |
| `builtin-parts.js` | Broad built-in PassMark CPU/GPU lookup list |
| `config.js` | Public client-side Supabase URL and publishable/anon key |
| `setup.sql` | Supabase tables, row-level security, and admin RPC functions |
| `SCORING-MODEL.md` | Scoring formula, profile weights, benchmark sources, limitations, and evidence levels |
| `scripts/check-benchmark-data.js` | Validates curated benchmark data for missing fields, invalid values, and alias collisions |
| `scripts/update-parts.mjs` | Fetches and validates the weekly PassMark part list before updating it |
| `scripts/supabase-keepalive.mjs` | Checks/keeps the configured Supabase project alive |
| `scripts/check-listings.mjs` | Daily check of saved leboncoin links; removes listings whose ad is gone (dry run unless enabled) |
| `tests/scoring-engine.test.js` | Regression tests for profiles, fallbacks, GPU suites, and coverage |
| `.github/workflows/validate-static-app.yml` | JavaScript syntax, dataset validation, and scoring regression checks |
| `.github/workflows/update-parts.yml` | Scheduled/manual PassMark refresh |
| `.github/workflows/supabase-keepalive.yml` | Daily Supabase keep-alive job |
| `.github/workflows/check-listings.yml` | Daily link check job for `check-listings.mjs` |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the app fits together and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting/database setup.

## Run the checks

Install Node.js (22 is used by the validation workflow). There are no npm packages to install.

```bash
node --check scripts/check-benchmark-data.js
node scripts/check-benchmark-data.js
node tests/scoring-engine.test.js
```

The GitHub Actions validation workflow also extracts the inline application script from `index.html` and checks its JavaScript syntax. It runs on pushes and pull requests targeting `main`.

## Roadmap

- Import listings from pasted advert URLs or text, extracting hardware and price when confidence is sufficient.
- Continue improving benchmark coverage while keeping unsupported results explicit rather than presenting guesses as measured performance.

## License

No license file is currently included in this repository. Do not assume that the source is licensed for redistribution or reuse. Add an explicit license before inviting others to reuse or redistribute the code.

## Project status

Scam or Steal is an independent comparison aid, not a professional hardware inspection or a guarantee of marketplace honesty. Benchmark scores are estimates, market-price assumptions can become outdated, and a PC's condition, power supply, cooling, storage health, warranty, seller reliability, and included peripherals still matter. Always verify those details before buying.
