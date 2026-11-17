import { describe, it, expect, vi, afterEach } from "vitest";
import {
  makeDoc,
  readiness,
  sampleBrief,
  scopeSchema,
  workspaceSchema,
} from "./model";
import { planBrief } from "./planner";
import { importDocument, persist, readWorkspace, KEY } from "./storage";
import { markdown, safeFilename } from "./export";
afterEach(() => vi.unstubAllGlobals());
describe("local planning", () => {
  it("does not propose explicitly unwanted features", () => {
    const s = planBrief(
      "We need a website. We do not want online bookings. No ecommerce is required.",
    );
    expect(s.deliverables.some((d) => /Booking|Commerce/.test(d.title))).toBe(
      false,
    );
  });
  it("builds an editable scope with exact brief evidence", () => {
    const s = planBrief(sampleBrief);
    expect(scopeSchema.safeParse(s).success).toBe(true);
    expect(s.deliverables.length).toBe(4);
    expect(
      s.deliverables.every(
        (d) => sampleBrief.includes(d.evidence) && !d.confirmed,
      ),
    ).toBe(true);
    expect(s.mode).toBe("assisted");
  });
  it("keeps deferred bookings outside the current deliverables", () => {
    const s = planBrief(sampleBrief);
    expect(s.deliverables.some((d) => /booking/i.test(d.title))).toBe(false);
    expect(s.exclusions.some((e) => /booking/i.test(e.text))).toBe(true);
  });
  it("treats existing logos as supplied assets, not new design work", () => {
    expect(
      planBrief(sampleBrief).deliverables.some(
        (d) => d.title === "Brand identity",
      ),
    ).toBe(false);
  });
  it("never invents durations or agreed answers", () => {
    const s = planBrief(sampleBrief);
    expect(s.milestones.every((m) => m.days === null)).toBe(true);
    expect(s.questions.every((q) => q.answer === "")).toBe(true);
  });
  it("provides a clarification deliverable when requirements are unclear", () => {
    const s = planBrief(
      "We need help with something for our business. Let us talk.",
    );
    expect(s.deliverables[0].title).toBe("Define the primary deliverable");
    expect(s.questions.length).toBeGreaterThan(3);
  });
});
describe("readiness and exports", () => {
  it("starts at zero without a scope", () =>
    expect(readiness(makeDoc()).percent).toBe(0));
  it("requires reviewed deliverables and essential answers", () => {
    const d = makeDoc("Website", "Client", sampleBrief);
    d.scope = planBrief(sampleBrief);
    d.sourceBrief = sampleBrief;
    expect(readiness(d).percent).toBe(60);
    d.scope.deliverables.forEach((x) => (x.confirmed = true));
    d.scope.questions
      .filter((q) => q.required)
      .forEach((q) => (q.answer = "Discussed and agreed with the client."));
    expect(readiness(d).percent).toBe(100);
  });
  it("makes a changed brief unready and exports it as a draft", () => {
    const d = makeDoc("Website", "Client", sampleBrief);
    d.scope = planBrief(sampleBrief);
    d.sourceBrief = "Earlier version";
    d.ready = true;
    expect(readiness(d).checks.at(-1)?.ok).toBe(false);
    expect(markdown(d)).toContain("Draft — review");
  });
  it("exports unresolved questions, criteria, exclusions and uncommitted durations", () => {
    const d = makeDoc("Website", "Client", sampleBrief);
    d.scope = planBrief(sampleBrief);
    const md = markdown(d);
    expect(md).toContain("Acceptance criteria:");
    expect(md).toContain("To be confirmed");
    expect(md).toContain("duration to be agreed");
    expect(md).toContain("online bookings later");
  });
  it("never marks an empty deliverable list reviewed", () => {
    const d = makeDoc("Website", "Client", sampleBrief);
    d.scope = planBrief(sampleBrief);
    d.scope.deliverables = [];
    expect(readiness(d).checks[1].ok).toBe(false);
  });
  it("generates a safe fallback filename", () => {
    expect(safeFilename("../../")).toBe("project-scope");
    expect(safeFilename("Luma Studio / Website")).toBe("luma-studio-website");
  });
});
describe("portable workspace data", () => {
  it("imports an export as a separate unapproved draft with fresh nested IDs", () => {
    const d = makeDoc("Website", "Client", sampleBrief);
    d.scope = planBrief(sampleBrief);
    d.ready = true;
    const imported = importDocument(JSON.stringify({ document: d }));
    expect(imported.id).not.toBe(d.id);
    expect(imported.scope?.deliverables[0].id).not.toBe(
      d.scope.deliverables[0].id,
    );
    expect(imported.ready).toBe(false);
    expect(imported.scope?.summary).toBe(d.scope.summary);
  });
  it("rejects invalid and oversized imports without accepting arbitrary objects", () => {
    expect(() => importDocument("{")).toThrow("not valid JSON");
    expect(() => importDocument('{"title":"hello"}')).toThrow(
      "not a valid ClientScope",
    );
    expect(() => importDocument("a".repeat(250001))).toThrow("too large");
  });
  it("validates workspace and duration limits", () => {
    const d = makeDoc();
    d.scope = planBrief(sampleBrief);
    d.scope.milestones[0].days = 1.5;
    expect(
      workspaceSchema.safeParse({ version: 1, documents: [d] }).success,
    ).toBe(false);
  });
  it("persists and restores complete scope data", () => {
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
    });
    const d = makeDoc("Website");
    expect(persist({ version: 1, documents: [d] })).toBe(true);
    expect(readWorkspace().workspace.documents[0].id).toBe(d.id);
    expect(memory.has(KEY)).toBe(true);
  });
  it("reports corrupt or unavailable storage without throwing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{",
      setItem: () => {
        throw Error("Full");
      },
    });
    expect(readWorkspace().warning).toBeTruthy();
    expect(persist({ version: 1, documents: [] })).toBe(false);
  });
});
