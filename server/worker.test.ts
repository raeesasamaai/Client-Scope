import { it, expect, describe, vi } from "vitest";
import { analyseRequest } from "./worker";
import { sampleBrief } from "../src/lib/model";
import { planBrief } from "../src/lib/planner";
const request = (brief = sampleBrief) =>
  new Request("https://clientscope.test/api/analyse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://clientscope.test",
      "CF-Connecting-IP": crypto.randomUUID(),
    },
    body: JSON.stringify({ brief }),
  });
describe("analysis API", () => {
  it("returns a complete local plan without a provider key", async () => {
    const r = await analyseRequest(request(), {});
    expect(r.status).toBe(200);
    expect(((await r.json()) as any).scope.mode).toBe("assisted");
  });
  it("rejects short briefs and incompatible methods", async () => {
    expect((await analyseRequest(request("short"), {})).status).toBe(400);
    expect(
      (
        await analyseRequest(
          new Request("https://clientscope.test/api/analyse"),
          {},
        )
      ).status,
    ).toBe(405);
  });
  it("rejects cross-origin submissions and oversized bodies", async () => {
    const r = request();
    r.headers.set("Origin", "https://other.test");
    expect((await analyseRequest(r, {})).status).toBe(403);
    expect((await analyseRequest(request("x".repeat(46000)), {})).status).toBe(
      413,
    );
  });
  it("never sends a request to a paid model", async () => {
    const f = vi.fn();
    const r = await analyseRequest(
      request(),
      { APINEX_API_KEY: "test", APINEX_MODEL: "paid/model" },
      f,
    );
    expect(f).not.toHaveBeenCalled();
    expect(((await r.json()) as any).scope.mode).toBe("assisted");
  });
  it("falls back on provider failures", async () => {
    const f = vi
      .fn()
      .mockResolvedValue(new Response("Unavailable", { status: 503 }));
    const r = await analyseRequest(request(), { APINEX_API_KEY: "test" }, f);
    expect(((await r.json()) as any).scope.mode).toBe("assisted");
  });
  it("normalises AI proposals and strips unsupported evidence and commitments", async () => {
    const s = planBrief(sampleBrief);
    s.deliverables[0].confirmed = true;
    s.deliverables[0].evidence = "This quote is not in the source.";
    s.questions[0].answer = "Invented agreement";
    s.milestones[0].days = 99;
    const f = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(s) } }],
          }),
        ),
      );
    const r = await analyseRequest(request(), { APINEX_API_KEY: "test" }, f);
    const body = (await r.json()) as any;
    expect(body.scope.mode).toBe("ai");
    expect(body.scope.deliverables[0].confirmed).toBe(false);
    expect(body.scope.deliverables[0].evidence).toBe("");
    expect(body.scope.questions[0].answer).toBe("");
    expect(body.scope.milestones[0].days).toBe(null);
  });
  it("falls back when the provider returns malformed JSON", async () => {
    const f = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "not json" } }] }),
        ),
      );
    const r = await analyseRequest(request(), { APINEX_API_KEY: "test" }, f);
    expect(((await r.json()) as any).scope.mode).toBe("assisted");
  });
});
