// Classification rules of the link checker: only positive evidence may say "gone".
import assert from "node:assert/strict";
import { checkLink } from "../scripts/check-listings.mjs";
const mk = (status, { headers = {}, body = "" } = {}) => async () => ({ status, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, text: async () => body });
const U = "https://www.leboncoin.fr/ad/ordinateurs/3287263221";
const cases = [
  ["404 is gone", mk(404), "gone"], ["410 is gone", mk(410), "gone"],
  ["403 is unknown", mk(403), "unknown"], ["429 is unknown", mk(429), "unknown"], ["503 is unknown", mk(503), "unknown"],
  ["redirect away is gone", mk(301, { headers: { location: "https://www.leboncoin.fr/c/ordinateurs" } }), "gone"],
  ["redirect to captcha is unknown", mk(302, { headers: { location: "https://geo.captcha-delivery.com/x" } }), "unknown"],
  ["redirect that keeps the ad id is unknown", mk(301, { headers: { location: "https://www.leboncoin.fr/ad/ordinateurs/3287263221?x=1" } }), "unknown"],
  ["'plus disponible' text is gone", mk(200, { body: "<html>Cette annonce n’est plus disponible</html>" }), "gone"],
  ["captcha page is unknown", mk(200, { body: "<html>datadome captcha</html>" }), "unknown"],
  ["normal page is alive", mk(200, { body: "<html>" + "annonce ".repeat(50) + "</html>" }), "alive"],
  ["network error is unknown", async () => { throw new Error("boom"); }, "unknown"],
];
for (const [name, f, want] of cases) assert.equal((await checkLink(U, f)).state, want, name);
console.log("Link checker tests passed (" + cases.length + " cases)");
