/* Versioned performance model. Benchmark ratios are only compared within a compatible source/test suite. */
(function(root){
  "use strict";
  const MODEL_VERSION = "performance-v2.3";
  const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  function findRecord(rows, name) {
    const key = normalize(name);
    return (rows || []).find(row => [row.model, ...(row.aliases || [])].some(alias => normalize(alias) === key)) || null;
  }
  function singleThreadRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.cpuSingleThread) || [], name);
  }
  function gpuGamingRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.gpuGaming) || [], name);
  }
  function cpuGamingRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.cpuGaming) || [], name);
  }
  function cpuAppSingleRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.cpuAppSingleThread) || [], name);
  }
  function cpuAppMultiRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.cpuAppMultiThread) || [], name);
  }
  function score(parts, reference, profile) {
    const cpuMark = Math.max(0, Number(parts.cpuScore) || 0);
    const gpuMark = Math.max(0, Number(parts.gpuScore) || 0);
    const refCpu = Math.max(1, Number(reference.cpu) || 1);
    const refGpu = Math.max(1, Number(reference.gpu) || 1);
    const record = singleThreadRecord(parts.cpuName);
    const refRecord = singleThreadRecord(reference.cpuName);
    const useSingleThreadBenchmarks = !!(record && refRecord);
    const cpuSingle = useSingleThreadBenchmarks ? record.score : cpuMark;
    const refSingle = useSingleThreadBenchmarks ? refRecord.score : refCpu;
    const cpuMultiPct = cpuMark / refCpu * 100;
    const cpuSinglePct = cpuSingle / refSingle * 100;
    const singleMix = Math.max(0, Math.min(1, Number(profile.singleMix ?? 0.5)));
    const passmarkCpuPct = cpuSinglePct * singleMix + cpuMultiPct * (1 - singleMix);
    const cpuGame = cpuGamingRecord(parts.cpuName);
    const refCpuGame = cpuGamingRecord(reference.cpuName);
    const cpuAppSingle = cpuAppSingleRecord(parts.cpuName);
    const refCpuAppSingle = cpuAppSingleRecord(reference.cpuName);
    const cpuAppMulti = cpuAppMultiRecord(parts.cpuName);
    const refCpuAppMulti = cpuAppMultiRecord(reference.cpuName);
    const cpuGamingAvailable = !!(profile.useCpuGamingBenchmarks && cpuGame && refCpuGame && cpuGame.score > 0 && refCpuGame.score > 0);
    const cpuAppsAvailable = !!(profile.useCpuAppBenchmarks && cpuAppSingle && refCpuAppSingle && cpuAppMulti && refCpuAppMulti &&
      cpuAppSingle.score > 0 && refCpuAppSingle.score > 0 && cpuAppMulti.score > 0 && refCpuAppMulti.score > 0);
    const cpuPct = cpuGamingAvailable ? cpuGame.score / refCpuGame.score * 100
      : cpuAppsAvailable ? (cpuAppSingle.score / refCpuAppSingle.score * 100) * singleMix + (cpuAppMulti.score / refCpuAppMulti.score * 100) * (1 - singleMix)
      : passmarkCpuPct;
    const cpuBenchmarkType = cpuGamingAvailable ? "tomCpuGaming" : cpuAppsAvailable ? "tomCpuApps" : "passmark";
    const rawGpuPct = gpuMark / refGpu * 100;
    const gameRecord = gpuGamingRecord(parts.gpuName);
    const refGameRecord = gpuGamingRecord(reference.gpuName);
    const resolution = ["1080p", "1440p", "4k"].includes(profile.resolution) ? profile.resolution : "1440p";
    const graphicsMode = profile.graphicsMode === "rayTracing" ? "rayTracing" : "raster";
    const gameScoresAvailable = !!(profile.useGameBenchmarks && gameRecord && refGameRecord &&
      gameRecord[graphicsMode] && refGameRecord[graphicsMode] &&
      gameRecord[graphicsMode][resolution] > 0 && refGameRecord[graphicsMode][resolution] > 0);
    const gpuPct = gameScoresAvailable
      ? gameRecord[graphicsMode][resolution] / refGameRecord[graphicsMode][resolution] * 100
      : rawGpuPct;
    const cpuShare = Math.max(0, Number(profile.cpuShare ?? 0.5));
    const gpuShare = Math.max(0, Number(profile.gpuShare ?? 0.5));
    const total = cpuShare + gpuShare || 1;
    const idx = Math.max(0, cpuPct * cpuShare / total + gpuPct * gpuShare / total);
    const hasCuratedCpuEvidence = cpuGamingAvailable || cpuAppsAvailable || useSingleThreadBenchmarks;
    const confidence = gameScoresAvailable && hasCuratedCpuEvidence ? "high"
      : (gameScoresAvailable || hasCuratedCpuEvidence) ? "medium" : "low";
    const evidence = [
      cpuGamingAvailable ? "Tom's Hardware 2026 17-game CPU suite"
        : cpuAppsAvailable ? "Tom's Hardware 2026 single-/multi-thread application suites"
        : useSingleThreadBenchmarks ? "PassMark CPU single-thread + CPU Mark multi-thread"
        : "PassMark CPU Mark fallback for single-thread",
      gameScoresAvailable ? `Tom's Hardware 2026 ${graphicsMode === "rayTracing" ? "ray-tracing" : "raster"} ${resolution} GPU suite` : "PassMark G3D Mark GPU fallback"
    ].join("; ");
    return {
      idx, cpuPct, cpuSinglePct, cpuMultiPct, cpuSingleScore: cpuSingle, cpuSingleMeasured: !!record,
      cpuPassmarkPct: passmarkCpuPct, cpuBenchmarkType, cpuGamingMeasured: cpuGamingAvailable, cpuAppsMeasured: cpuAppsAvailable,
      gpuPct, gpuPassmarkPct: rawGpuPct, gpuGamingMeasured: gameScoresAvailable,
      gpuBenchmarkType: gameScoresAvailable ? graphicsMode : "passmark",
      gpuResolution: resolution, confidence, evidence, modelVersion: MODEL_VERSION
    };
  }
  root.PVL_SCORING = { score, normalize, modelVersion: MODEL_VERSION, singleThreadRecord, gpuGamingRecord, cpuGamingRecord, cpuAppSingleRecord, cpuAppMultiRecord };
})(window);