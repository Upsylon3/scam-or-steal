/* Pure, versioned performance scoring. No prices, RAM market values, or storage market values enter performance. */
(function(root){
  "use strict";
  const MODEL_VERSION = "performance-v2.1";
  const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  function singleThreadRecord(name) {
    const rows = (root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.cpuSingleThread) || [];
    const key = normalize(name);
    return rows.find(row => [row.model, ...(row.aliases || [])].some(alias => normalize(alias) === key)) || null;
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
    const gpuPct = gpuMark / refGpu * 100;
    const singleMix = Math.max(0, Math.min(1, Number(profile.singleMix ?? 0.5)));
    const cpuPct = cpuSinglePct * singleMix + cpuMultiPct * (1 - singleMix);
    const cpuShare = Math.max(0, Number(profile.cpuShare ?? 0.5));
    const gpuShare = Math.max(0, Number(profile.gpuShare ?? 0.5));
    const total = cpuShare + gpuShare || 1;
    const idx = Math.max(0, cpuPct * cpuShare / total + gpuPct * gpuShare / total);
    return {
      idx, cpuPct, cpuSinglePct, cpuMultiPct, cpuSingleScore: cpuSingle, cpuSingleMeasured: !!record, gpuPct,
      confidence: useSingleThreadBenchmarks ? "medium" : "low",
      evidence: useSingleThreadBenchmarks ? "PassMark single-thread + CPU Mark + GPU G3D Mark" : "PassMark CPU Mark proxy for CPU single-thread; PassMark CPU/GPU composite",
      modelVersion: MODEL_VERSION
    };
  }
  root.PVL_SCORING = { score, normalize, modelVersion: MODEL_VERSION, singleThreadRecord };
})(window);