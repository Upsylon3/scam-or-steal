# Project description

## Scam or Steal

Scam or Steal is a free, browser-based tool for comparing second-hand desktop PC listings. It helps buyers distinguish a genuinely strong deal from a listing that is simply cheap or has impressive-sounding specifications.

A user records a listing's CPU, GPU, price, and optional memory, storage, setup and appearance details. The app then compares relative CPU/GPU performance against a chosen reference PC, estimates component-cost-based value, and ranks saved listings for a selected workload. The sortable comparison table, direct Versus view, filters, and CSV export support more detailed evaluation.

The tool is designed to be transparent about its evidence: curated benchmark suites are used only when the hardware is covered by a compatible suite, fallback methods are identified, and unsupported GPU-suite FPS estimates are omitted rather than fabricated. It is a comparison aid, not an automated marketplace scraper, fraud detector, or substitute for inspecting the hardware and seller.

### Intended audience

- Buyers comparing used gaming, productivity, and general-purpose PCs.
- People comparing several marketplace listings with different CPU/GPU combinations.
- Hardware enthusiasts who want a transparent, adjustable relative-performance model.
- Contributors who want to maintain benchmark coverage and the scoring implementation.

### Main goals

1. Make relative hardware performance easier to compare without requiring buyers to memorize benchmark rankings.
2. Put performance and value in separate scores so a faster PC is not automatically presented as the better deal.
3. Explain benchmark coverage and fallbacks instead of hiding missing data.
4. Keep personal listing data local by default, with optional account sync and backups.
5. Keep the application deployable as a static site without a package manager or build pipeline.

### Scope and non-goals

Scam or Steal currently compares details entered by the user. It does not automatically fetch marketplace ads, validate a seller's claims, inspect a PC, test component health, guarantee availability, or calculate exact game-specific FPS. Users should independently verify listing details, PSU quality, temperatures, hardware condition, warranty, peripherals, and seller reliability.


### Suggested GitHub repository description

> Compare used-PC listings with workload-aware CPU/GPU benchmarks, transparent value scores, and local-first tracking.

### Project at a glance

- **Application:** static HTML, CSS, and JavaScript.
- **Hosting:** GitHub Pages.
- **Optional shared backend:** Supabase.
- **Broad part lookup:** PassMark CPU Mark and G3D Mark values.
- **Curated evidence:** PassMark CPU single-thread data and Tom's Hardware CPU/GPU suite records where available.
- **Local development:** open `index.html`; Node.js is needed for validation tests and maintenance scripts.
- **Live site:** https://upsylon3.github.io/scam-or-steal/
- **Source:** https://github.com/Upsylon3/scam-or-steal
