# Scam or Steal scoring model

**Current performance model:** `performance-v2.4`

## Two scores, two questions

- **Performance index** asks how the CPU and GPU compare with the selected reference PC for the selected workload.
- **Value index** retains the app's market-price-share model and adjusts for RAM/storage market value and the optional aesthetics setting. It is not used as a proxy for raw performance.
- **Value per currency** divides the value index by effective price.
- **Performance per currency** divides the workload performance index by effective price.

An included setup deduction is capped so effective price never falls below 1 currency unit.

## Performance formula

For each listing:

1. CPU single-thread percentage is taken from the curated PassMark single-thread table when both the listing CPU and reference CPU have entries. If either CPU is missing, the model uses the CPU Mark ratio for both sides, avoiding a mixed benchmark scale.
2. CPU multi-thread percentage uses PassMark CPU Mark relative to the reference CPU Mark.
3. For Gaming and CPU-heavy / competitive gaming, CPU percentage uses Tom’s Hardware’s 2026 17-game 1080p CPU suite when both listing and reference CPUs are covered. For CPU-heavy productivity, the model uses the matched Tom’s Hardware single-threaded and multi-threaded application indices, blended using `singleMix`. If both CPUs do not have the required records, it falls back to PassMark-based CPU percentages for both sides. Other profiles blend PassMark CPU single-thread and multi-thread percentages using `singleMix`.
4. GPU percentage uses Tom's Hardware's GPU gaming suite only for the Gaming and CPU-heavy/competitive-gaming profiles, and only when both the listing GPU and reference GPU are in the curated suite. The selected resolution and raster/ray-tracing mode are used. Otherwise, GPU percentage falls back to PassMark G3D Mark relative to the reference.
5. CPU and GPU percentages are combined using the selected profile's CPU/GPU shares.

| Profile | CPU share | GPU share | Single-thread mix |
| --- | ---: | ---: | ---: |
| Balanced / general use | 45% | 55% | 45% |
| Gaming | 35% | 65% | 75% |
| CPU-heavy / competitive gaming | 60% | 40% | 80% |
| GPU-heavy workloads | 20% | 80% | 20% |
| CPU-heavy productivity | 75% | 25% | 15% |

These profiles are useful relative estimates, not a substitute for exact game- or application-specific benchmark results. The app also reports an **estimated GPU-suite FPS** when a GPU has a curated record: it multiplies the GPU’s suite percentage by the source’s published RTX 5090 geometric-mean FPS at the chosen resolution and rendering mode. This is a multi-game suite aggregate, not an estimate for any one title and not a guarantee for the whole PC. The published GPU testbed uses a Ryzen 7 9800X3D, so slower CPUs can bottleneck more strongly, especially at 1080p. RAM/VRAM capacity, power limits, cooling, drivers and game settings can also change real outcomes. Unsupported GPUs deliberately show no FPS estimate rather than an invented or interpolated value.

## Benchmark data

### CPU single-thread

`benchmark-data.js` contains explicitly sourced PassMark PerformanceTest single-thread ratings and a subset of Tom’s Hardware CPU Hierarchy 2026 gaming, single-threaded application and multi-threaded application scores. Each record includes aliases and a source URL. Tom’s CPU gaming suite tests 17 games at 1080p with an RTX 5090 FE; it is a CPU-limited comparison suite, not a prediction of a user’s exact FPS. The application suite uses a separate test bench and must not be mixed with PassMark scores. PassMark CPU Mark and G3D Mark remain the broad fallback and are refreshed by the existing generator.

### GPU gaming

`benchmark-data.js` contains a curated subset of Tom's Hardware's 2026 GPU hierarchy:
- rasterization at native 1080p, 1440p and 4K Ultra;
- a separate ray-tracing suite at the same resolutions;
- indices relative to the RTX 5090 in the corresponding resolution/mode table. The FPS estimator uses the source’s RTX 5090 suite baselines: raster 203.8 / 167.3 / 110.8 FPS and ray tracing 125.7 / 100.8 / 64.1 FPS at 1080p / 1440p / 4K respectively. These are geometric-mean suite results, not per-game values.

The source suite uses a geometric mean across multiple games and excludes upscaling/frame generation. These percentages should never be described as expected FPS in an individual game.

Source: https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html

### Evidence quality

- **High:** both CPU single-thread records and a compatible GPU gaming-suite record are available.
- **Medium:** one of those two evidence groups is available.
- **Low:** the score falls back to the broad PassMark CPU/GPU composite.

Confidence describes benchmark coverage, not certainty about a particular PC's real-world performance.

## Adding or refreshing data

The benchmark dataset is curated, not silently auto-updated. A data validation script checks source URLs, numeric ranges, duplicate model aliases and the update date on every CI run. This catches malformed edits, not changed values at the source; a human still needs to refresh the records when the source methodology or rankings change.

1. Verify the exact model and benchmark value on the linked source page.
2. Preserve the source URL, aliases and benchmark suite/methodology.
3. Only compare scores within the same source/test suite, resolution and mode. Do not merge scores from different test benches into one scale.
4. If a GPU is not in the gaming suite, let it fall back to PassMark instead of estimating or interpolating a score.
5. Update `updatedAt` and the model version when a scoring behavior changes.
6. Run `node scripts/check-benchmark-data.js`, `node tests/scoring-engine.test.js` and the GitHub Actions static-app workflow.

## Regression coverage

The tests check the Ryzen 5 2600X to Ryzen 7 5700X upgrade with the same GPU, CPU gaming suite selection, productivity app-suite blending, resolution-specific raster scores, separate ray-tracing scores, unknown hardware fallback, custom reference fallback, and minimum dataset coverage.
