import { type ScopeDoc, readiness } from "./model";
export function markdown(doc: ScopeDoc): string {
  const s = doc.scope;
  if (!s) throw new Error("Generate a scope first.");
  const lines = [
    `# ${doc.title || "Untitled project"}`,
    `Client: ${doc.client || "Not specified"}`,
    `Status: ${doc.ready && readiness(doc).percent === 100 ? "Ready for client review" : "Draft — review and confirm before use"}`,
    `Prepared: ${new Date(doc.updatedAt).toLocaleDateString("en-ZA")}`,
    "",
    s.summary,
    "",
    "## Goals",
    ...s.goals.map((g) => `- ${g.text}`),
    "",
    "## Deliverables",
  ];
  s.deliverables.forEach((d) =>
    lines.push(
      "",
      `### ${d.title}`,
      `Review: ${d.confirmed ? "Confirmed by project owner" : "Proposed"}`,
      d.description,
      `Acceptance criteria: ${d.criteria}`,
      d.evidence ? `Brief evidence: ${d.evidence}` : "",
    ),
  );
  lines.push("", "## Open questions");
  s.questions.forEach((q) =>
    lines.push(
      `- ${q.text}${q.required ? " [essential]" : ""}\n  Answer: ${q.answer || "To be confirmed"}`,
    ),
  );
  lines.push(
    "",
    "## Proposed assumptions",
    ...s.assumptions.map((a) => `- ${a.text}`),
    "",
    "## Exclusions / future phase",
    ...s.exclusions.map((a) => `- ${a.text}`),
    "",
    "## Milestones",
  );
  s.milestones.forEach((m, i) =>
    lines.push(
      `${i + 1}. ${m.title}${m.days ? ` — ${m.days} working days (estimate)` : " — duration to be agreed"}\n   ${m.description}`,
    ),
  );
  lines.push(
    "",
    "---",
    "Prepared with ClientScope. This is a planning document, not a signed agreement. Estimates, costs, responsibilities and third-party services require confirmation.",
  );
  return lines.filter((x) => x !== undefined).join("\n");
}
export function download(contents: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function safeFilename(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "project-scope"
  );
}
