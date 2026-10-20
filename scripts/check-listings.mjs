// Daily check of saved leboncoin links: removes listings whose ad is gone.
//
// HOW IT FINDS LINKS: a listing's link is its name when you pasted an ad URL as the name. Only leboncoin.fr links are checked.
// WHERE IT RUNS: it talks to Supabase with the SERVICE ROLE key (a secret, never put it in config.js or the repo), so it only
//   reaches listings that are synced to an account. Listings that live only in one browser's localStorage are out of reach.
//
// SAFETY RULES (the whole point: a wrong delete loses a listing, a missed delete costs nothing):
//  1. Only POSITIVE evidence counts as "gone": HTTP 404/410, a redirect away from the ad, or the page saying the ad is no longer available.
//  2. Anything unclear (captcha, 403/429/5xx, network error, odd page) is "unknown" and never counts against a listing.
//  3. A listing must be "gone" on 2 runs in a row before it is deleted. A single "alive"/"unknown" answer resets nothing but never adds a strike.
//  4. If more than half of the checked links look gone in one run, the run aborts: that means the site changed or is blocking us.
//  5. Dry run unless LINK_CHECK_DELETE=true. In a dry run it only prints what it would do.
//
// leboncoin forbids automated access in its robots.txt and uses bot protection, so expect "unknown" from datacenter IPs such as
// GitHub's. We do not try to evade that: slow, one request at a time, honest User-Agent. If the runner is blocked, run this same script
// from your own PC (home IP) on a schedule instead. Use --probe <url> to see what the script makes of a single link.

const URL_BASE = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DELETE = process.env.LINK_CHECK_DELETE === "true";
const STRIKES_NEEDED = Number(process.env.LINK_CHECK_STRIKES || 2);
const MAX_GONE_SHARE = 0.5;
const DELAY_MS = Number(process.env.LINK_CHECK_DELAY_MS || 6000); // pause between requests, plus up to 50% jitter
const UA = "pc-value-lab-link-check (personal tool; checks my own saved ads)";

const GONE_TEXT = [/n['’]est plus disponible/i, /annonce (a été |est )?(supprimée|désactivée|expirée)/i, /cette annonce (n['’]existe|a disparu)/i];
const BLOCK_TEXT = [/datadome/i, /captcha-delivery/i, /geo\.captcha/i, /access denied/i, /vérification/i];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isLbc = (n) => /^https?:\/\/(www\.)?leboncoin\.fr\/ad\//i.test(n || "");
const adId = (u) => (u.match(/\/(\d{6,})\/?(?:[?#].*)?$/) || [])[1] || "";

// -> { state: "alive" | "gone" | "unknown", why }
export async function checkLink(url, fetchImpl = fetch) {
  let res;
  try {
    res = await fetchImpl(url, { redirect: "manual", headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9" } });
  } catch (e) { return { state: "unknown", why: "network error: " + e.message }; }
  const s = res.status;
  if (s === 404 || s === 410) return { state: "gone", why: "HTTP " + s };
  if ([401, 403, 429].includes(s) || s >= 500) return { state: "unknown", why: "HTTP " + s + " (blocked or server trouble)" };
  if (s >= 300 && s < 400) {
    const loc = res.headers.get("location") || "";
    if (/captcha|datadome/i.test(loc)) return { state: "unknown", why: "redirected to a bot check" };
    const id = adId(url);
    if (id && loc && !loc.includes(id)) return { state: "gone", why: "redirected away from the ad to " + loc.slice(0, 80) };
    return { state: "unknown", why: "redirect to " + loc.slice(0, 80) };
  }
  let body = "";
  try { body = (await res.text()).slice(0, 400000); } catch { return { state: "unknown", why: "could not read the page" }; }
  if (BLOCK_TEXT.some((r) => r.test(body)) && body.length < 20000) return { state: "unknown", why: "bot-check page" };
  if (GONE_TEXT.some((r) => r.test(body))) return { state: "gone", why: "page says the ad is no longer available" };
  if (s === 200) return { state: "alive", why: "HTTP 200, no 'gone' marker" };
  return { state: "unknown", why: "HTTP " + s };
}

async function rest(path, opts = {}) {
  const r = await fetch(URL_BASE + "/rest/v1/" + path, { ...opts, headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(path + " -> HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  return r;
}

async function main() {
  const pi = process.argv.indexOf("--probe");
  if (pi > -1) {
    const u = process.argv[pi + 1];
    const r = await checkLink(u);
    console.log(JSON.stringify({ url: u, ...r }, null, 2));
    return;
  }
  if (!URL_BASE || !KEY) { console.log("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set: nothing to do."); return; }
  console.log(DELETE ? "MODE: delete listings that are gone" : "MODE: dry run (set LINK_CHECK_DELETE=true to delete)");

  const rows = await (await rest("user_listings?select=user_id,items,rev")).json();
  const strikes = new Map((await (await rest("link_checks?select=user_id,item_id,misses")).json()).map((x) => [x.user_id + "|" + x.item_id, x.misses]));
  const jobs = [];
  for (const row of rows) for (const it of Array.isArray(row.items) ? row.items : []) if (it && !it.deleted && isLbc(it.name)) jobs.push({ row, it });
  console.log(jobs.length + " leboncoin link(s) to check");
  if (!jobs.length) return;

  const results = [];
  for (const j of jobs) {
    const r = await checkLink(j.it.name);
    results.push({ ...j, ...r });
    console.log(`${r.state.padEnd(7)} ${j.it.name}  (${r.why})`);
    await sleep(DELAY_MS * (1 + Math.random() * 0.5));
  }

  const checked = results.filter((r) => r.state !== "unknown").length;
  const gone = results.filter((r) => r.state === "gone");
  if (results.length >= 4 && gone.length / results.length > MAX_GONE_SHARE) {
    console.error(`ABORT: ${gone.length} of ${results.length} links look gone. That is more likely a site change or a block than real. Nothing was changed.`);
    process.exit(1);
  }

  // strike bookkeeping: gone = +1, alive = reset to 0, unknown = unchanged
  const now = new Date().toISOString(), upserts = [], toDelete = new Map();
  for (const r of results) {
    const k = r.row.user_id + "|" + r.it.id, prev = strikes.get(k) || 0;
    if (r.state === "unknown") continue;
    const misses = r.state === "gone" ? prev + 1 : 0;
    upserts.push({ user_id: r.row.user_id, item_id: r.it.id, misses, last_status: r.why.slice(0, 120), last_checked: now });
    if (r.state === "gone" && misses >= STRIKES_NEEDED) {
      if (!toDelete.has(r.row.user_id)) toDelete.set(r.row.user_id, []);
      toDelete.get(r.row.user_id).push(r.it.id);
    }
  }
  console.log(`${checked} answered, ${gone.length} gone this run, ${[...toDelete.values()].flat().length} reached ${STRIKES_NEEDED} strikes`);
  if (upserts.length) await rest("link_checks?on_conflict=user_id,item_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(upserts) });

  for (const [uid, ids] of toDelete) {
    if (!DELETE) { console.log(`dry run: would delete ${ids.length} listing(s) for one account`); continue; }
    // Same protocol as the site: replace each listing by a deletion marker (so every device drops it on next sync) and bump rev.
    // The PATCH only applies if rev is unchanged; if the user saved in between, we skip and retry tomorrow.
    const row = rows.find((x) => x.user_id === uid), t = Date.now();
    const items = row.items.map((e) => (ids.includes(e.id) ? { id: e.id, deleted: true, updatedAt: t } : e));
    const r = await rest(`user_listings?user_id=eq.${uid}&rev=eq.${row.rev}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ items, rev: row.rev + 1, updated_at: now }) });
    const done = (await r.json()).length;
    console.log(done ? `deleted ${ids.length} listing(s)` : "account changed while checking, will retry next run");
    if (done) await rest(`link_checks?user_id=eq.${uid}&item_id=in.(${ids.join(",")})`, { method: "DELETE" });
  }
}

if (process.argv[1] && process.argv[1].endsWith("check-listings.mjs")) main().catch((e) => { console.error("FAILED: " + e.message); process.exit(1); });
