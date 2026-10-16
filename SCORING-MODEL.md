# Scam or Steal scoring model

**Current performance model:** `performance-v2.2`

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
3. The workload profile blends those two CPU percentages using its `singleMix` value.
4. GPU percentage uses Tom's Hardware's GPU gaming suite only for the Gaming and CPU-heavy/competitive-gaming profiles, and only when both the listing GPU and reference GPU are in the curated suite. The selected resolution and raster/ray-tracing mode are used. Otherwise, GPU percentage falls back to PassMark G3D Mark relative to the reference.
5. CPU and GPU percentages are combined using the selected profile's CPU/GPU shares.

| Profile | CPU share | GPU share | Single-thread mix |
| --- | ---: | ---: | ---: |
| Balanced / general use | 45% | 55% | 45% |
| Gaming | 35% | 65% | 75% |
| CPU-heavy / competitive gaming | 60% | 40% | 80% |
| GPU-heavy workloads | 20% | 80% | 20% |
| CPU-heavy productivity | 75% | 25% | 15% |

These profiles are useful relative estimates, not a substitute for exact game- or application-specific benchmark results. RAM capacity, VRAM capacity, power limits, cooling, drivers, game settings and CPU/GPU bottlenecks can change real outcomes; this index does not predict FPS.

## Benchmark data

### CPU single-thread

`benchmark-data.js` contains explicitly sourced PassMark PerformanceTest single-thread ratings for selected CPUs. Each record includes aliases and its source URL. PassMark's CPU Mark and G3D Mark datasets in `builtin-parts.js` remain the broad fallback and are refreshed by the existing generator.

### GPU gaming

`benchmark-data.js` contains a curated subset of Tom's Hardware's 2026 GPU hierarchy:
- rasterization at native 1080p, 1440p and 4K Ultra;
- a separate ray-tracing suite at the same resolutions;
- indices relative to the RTX 5090 in the corresponding resolution/mode table.

The source suite uses a geometric mean across multiple games and excludes upscaling/frame generation. These percentages should never be described as expected FPS in an individual game.

Source: https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html

### Evidence quality

- **High:** both CPU single-thread records and a compatible GPU gaming-suite record are available.
- **Medium:** one of those two evidence groups is available.
- **Low:** the score falls back to the broad PassMark CPU/GPU composite.

Confidence describes benchmark coverage, not certainty about a particular PC's real-world performance.

## Adding or refreshing data

1. Verify the exact model and benchmark value on the linked source page.
2. Preserve the source URL, aliases and benchmark suite/methodology.
3. Only compare scores within the same source/test suite, resolution and mode. Do not merge scores from different test benches into one scale.
4. If a GPU is not in the gaming suite, let it fall back to PassMark instead of estimating or interpolating a score.
5. Update `updatedAt` and the model version when a scoring behavior changes.
6. Run `node tests/scoring-engine.test.js` and the GitHub Actions static-app workflow.

## Regression coverage

The tests check the Ryzen 5 2600X to Ryzen 7 5700X upgrade with the same GPU, the stronger impact of a CPU upgrade in the CPU-heavy profile, resolution-specific raster scores, separate ray-tracing scores, unknown hardware fallback, custom reference fallback, and minimum dataset coverage.
