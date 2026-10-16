#!/usr/bin/env node
"use strict";

global.window = global;
require("../benchmark-data.js");

const data = global.PVL_BENCHMARKS;
const errors = [];
const warn = message => console.warn("WARN: " + message);
const fail = message => errors.push(message);
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

if (!data || typeof data !== "object") throw new Error("PVL_BENCHMARKS was not loaded");
if (!Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) fail("schemaVersion must be a positive integer");
if (!isoDate.test(data.updatedAt || "") || Number.isNaN(Date.parse(data.updatedAt))) {
  fail("updatedAt must be a valid YYYY-MM-DD date");
} else {
  const ageDays = Math.floor((Date.now() - Date.parse(data.updatedAt + "T00:00:00Z")) / 86400000);
  if (ageDays < 0) fail("updatedAt must not be in the future");
  if (ageDays > 180) warn("curated benchmark data is more than 180 days old; manually review source pages");
}

const collections = [
  ["cpuSingleThread", data.cpuSingleThread, "score"],
  ["cpuGaming", data.cpuGaming, "score"],
  ["cpuAppSingleThread", data.cpuAppSingleThread, "score"],
  ["cpuAppMultiThread", data.cpuAppMultiThread, "score"]
];
for (const [name, rows, scoreKey] of collections) {
  if (!Array.isArray(rows) || rows.length === 0) {
    fail(name + " must be a non-empty array");
    continue;
  }
  const aliases = new Map();
  for (const row of rows) {
    if (!row.model || typeof row.model !== "string") fail(name + " has a record without a model");
    if (!Number.isFinite(row[scoreKey]) || row[scoreKey] <= 0) fail(name + " has an invalid score for " + (row.model || "(unknown)"));
    if (!/^https:\/\//.test(row.source || "")) fail(name + " has a missing or non-HTTPS source for " + (row.model || "(unknown)"));
    const names = [row.model, ...(row.aliases || [])];
    for (const label of names) {
      const key = String(label).toLowerCase().replace(/[^a-z0-9]+/g, "");
      const prior = aliases.get(key);
      if (prior && prior !== row.model) fail(name + " has duplicate normalized alias '" + label + "' for " + prior + " and " + row.model);
      else aliases.set(key, row.model);
    }
  }
}

if (!Array.isArray(data.gpuGaming) || data.gpuGaming.length === 0) {
  fail("gpuGaming must be a non-empty array");
} else {
  const aliases = new Map();
  for (const row of data.gpuGaming) {
    if (!row.model || !/^https:\/\//.test(row.source || "")) fail("GPU record has missing model/source");
    for (const label of [row.model, ...(row.aliases || [])]) {
      const key = String(label).toLowerCase().replace(/[^a-z0-9]+/g, "");
      const prior = aliases.get(key);
      if (prior && prior !== row.model) fail("gpuGaming has duplicate normalized alias '" + label + "'");
      else aliases.set(key, row.model);
    }
    for (const mode of ["raster", "rayTracing"]) {
      for (const resolution of ["1080p", "1440p", "4k"]) {
        const value = row[mode]?.[resolution];
        if (mode === "raster" && (!Number.isFinite(value) || value <= 0)) {
          fail("GPU " + row.model + " has invalid required raster score for " + resolution);
        } else if (value != null && (!Number.isFinite(value) || value <= 0)) {
          fail("GPU " + row.model + " has invalid optional " + mode + " score for " + resolution);
        }
      }
    }
  }
}

if (errors.length) {
  console.error("Benchmark data validation failed:");
  for (const error of errors) console.error(" - " + error);
  process.exitCode = 1;
} else {
  console.log("Benchmark data validation passed: schema v" + data.schemaVersion +
    ", updated " + data.updatedAt + ", " + data.cpuSingleThread.length + " PassMark CPU records, " +
    data.cpuGaming.length + " CPU gaming records, " + data.gpuGaming.length + " GPU gaming records.");
}
