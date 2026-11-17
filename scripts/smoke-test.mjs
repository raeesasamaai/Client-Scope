import assert from "node:assert/strict";
import worker from "../dist/server/index.js";
const request = (path, init) =>
  worker.fetch(new Request("https://clientscope.test" + path, init), {});
const page = await request("/");
assert.equal(page.status, 200);
assert.ok(page.headers.get("content-security-policy"));
const html = await page.text();
assert.match(html, /ClientScope/);
for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) {
  const asset = await request(match[1]);
  assert.equal(asset.status, 200);
  assert.ok((await asset.arrayBuffer()).byteLength > 0);
}
const result = await request("/api/analyse", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    brief:
      "We need a responsive website with a portfolio and a contact form. The budget and launch date need discussion.",
  }),
});
const body = await result.json();
assert.equal(body.scope.mode, "assisted");
assert.ok(body.scope.deliverables.length >= 3);
assert.ok(body.scope.questions.length >= 4);
assert.equal((await request("/api/health")).status, 200);
assert.equal((await request("/missing.js")).status, 404);
console.log(
  "Production smoke checks passed: page, assets, security headers, health, local analysis and 404.",
);
