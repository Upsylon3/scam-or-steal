# Contributing

Thanks for helping improve Scam or Steal. The most useful contributions improve ranking correctness, benchmark evidence, accessibility, reliability, or the clarity of the interface.

## Development setup

1. Install Node.js 22 or a compatible recent Node release.
2. Clone the repository.
3. Open `index.html` directly in a browser. No npm install or build step is needed.
4. For local-only work, clear the Supabase URL and key in `config.js` to prevent requests to the configured shared project.

```bash
git clone https://github.com/Upsylon3/scam-or-steal.git
cd scam-or-steal
node scripts/check-benchmark-data.js
node tests/scoring-engine.test.js
```

The automated validation workflow also extracts and syntax-checks the inline JavaScript in `index.html`.

## Before opening a pull request

- Describe the user-visible problem and expected behavior.
- Keep the change focused and explain any trade-off that affects ranking or saved data.
- Run the benchmark validator and scoring regression tests.
- Check the site in a browser at a narrow/mobile and desktop viewport when UI is affected.
- Do not commit personal listing backups, credentials, tokens, admin passphrases, or environment-specific secrets.
- Update documentation whenever a feature, configuration step, score definition, or maintenance workflow changes.

## Benchmark-data changes

Benchmark data is part of the product's evidence. Treat its provenance and comparability as required information.

1. Check the exact processor or graphics card model against the linked source.
2. Keep model aliases conservative and non-ambiguous.
3. Record the direct HTTPS source URL and identify the benchmark suite/methodology.
4. Compare numbers only when they come from the same suite, test bench, resolution, and rendering mode.
5. Do not fill gaps through interpolation or invent FPS values. Unsupported GPUs should keep the existing fallback behavior.
6. Update the dataset's `updatedAt` date for data refreshes and update the model version when scoring behavior changes.
7. Add or update regression tests when a scoring rule changes.

Run:

```bash
node scripts/check-benchmark-data.js
node tests/scoring-engine.test.js
```

The validator catches malformed data and alias collisions; it does not prove that source pages are accurate or unchanged. A human must review the source and methodology.

## Changes to scoring behavior

Scoring changes can change which listing appears to be the best deal. PRs should explain what changed, why the prior model was insufficient, and which tests demonstrate the intended behavior. Keep the following concepts separate:

- workload-specific performance relative to the reference PC;
- the component-cost-share value index;
- ratios such as performance per currency unit;
- the collection-relative normalized Value / 100 display;
- optional GPU-suite FPS, which is an aggregate estimate rather than a specific game's expected FPS.

Do not mix different benchmark scales or present a fallback as a directly measured result.

## Changes to Supabase or persisted data

Changes to `setup.sql`, account synchronization, listing IDs, merge timestamps, or deletion tombstones require extra care because a mistake can affect users' saved data. Explain compatibility and migration steps, preserve row-level security, and test with at least two sessions when changing sync behavior. Never grant public access to account-owned listing rows.

## Pull request checklist

- [ ] The purpose and expected behavior are explained.
- [ ] `node scripts/check-benchmark-data.js` passes.
- [ ] `node tests/scoring-engine.test.js` passes.
- [ ] Browser behavior was checked if the UI changed.
- [ ] Documentation is updated where relevant.
- [ ] No private data or secrets are included.
