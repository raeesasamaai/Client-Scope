import { z } from "zod";
export const uid = () => crypto.randomUUID();
const text = (max = 2000) => z.string().max(max);
const item = z.object({ id: text(100), text: text() });
export const scopeSchema = z.object({
  summary: text(3000),
  deliverables: z
    .array(
      z.object({
        id: text(100),
        title: text(200),
        description: text(),
        criteria: text(),
        evidence: text(1000),
        confirmed: z.boolean(),
      }),
    )
    .max(30),
  questions: z
    .array(
      z.object({
        id: text(100),
        text: text(),
        answer: text(),
        required: z.boolean(),
      }),
    )
    .max(30),
  goals: z.array(item).max(20),
  assumptions: z.array(item).max(20),
  exclusions: z.array(item).max(20),
  milestones: z
    .array(
      z.object({
        id: text(100),
        title: text(200),
        description: text(),
        days: z.number().int().min(1).max(365).nullable(),
      }),
    )
    .max(20),
  mode: z.enum(["assisted", "ai"]),
});
export type Scope = z.infer<typeof scopeSchema>;
export const documentSchema = z.object({
  id: text(100),
  title: text(120),
  client: text(120),
  brief: text(10000),
  sourceBrief: text(10000),
  createdAt: z.number(),
  updatedAt: z.number(),
  scope: scopeSchema.nullable(),
  ready: z.boolean(),
});
export type ScopeDoc = z.infer<typeof documentSchema>;
export const workspaceSchema = z.object({
  version: z.literal(1),
  documents: z.array(documentSchema).max(100),
});
export type Workspace = z.infer<typeof workspaceSchema>;
export function makeDoc(
  title = "Untitled project",
  client = "",
  brief = "",
): ScopeDoc {
  const now = Date.now();
  return {
    id: uid(),
    title,
    client,
    brief,
    sourceBrief: "",
    createdAt: now,
    updatedAt: now,
    scope: null,
    ready: false,
  };
}
export function readiness(doc: ScopeDoc) {
  const scope = doc.scope;
  if (!scope)
    return {
      percent: 0,
      checks: [{ label: "Generate your first scope", ok: false }],
    };
  const checks = [
    {
      label: "Project name and summary",
      ok: !!doc.title.trim() && !!scope.summary.trim(),
    },
    {
      label: "Deliverables reviewed",
      ok:
        scope.deliverables.length > 0 &&
        scope.deliverables.every(
          (d) => d.confirmed && d.title.trim() && d.criteria.trim(),
        ),
    },
    {
      label: "Essential questions answered",
      ok: scope.questions
        .filter((q) => q.required)
        .every((q) => !!q.answer.trim()),
    },
    {
      label: "Milestones defined",
      ok:
        scope.milestones.length > 0 &&
        scope.milestones.every((m) => !!m.title.trim()),
    },
    {
      label: "Scope matches the latest brief",
      ok: doc.brief === doc.sourceBrief,
    },
  ];
  return {
    checks,
    percent: Math.round(
      (checks.filter((c) => c.ok).length / checks.length) * 100,
    ),
  };
}
export const sampleBrief = `We’re Luma, a small interior design studio in Cape Town. We need a fresh website that feels warm, refined and easy to use on mobile. We’d like a home page, an about page, a portfolio of our projects, services and a contact page.

Clients should be able to browse project photos and send us an enquiry through a contact form. We want to update the portfolio ourselves, so a simple CMS would help. We have a logo and brand colours, but the copy and photography aren’t final yet.

We’d love to launch in about six weeks. Our budget isn’t confirmed. It should be easy to find us on Google. We may want online bookings later, but that isn’t part of this launch.`;
export const templates = [
  {
    title: "Studio website",
    client: "Luma Studio",
    kind: "Web design",
    brief: sampleBrief,
    description: "A considered website, portfolio, and enquiry flow.",
  },
  {
    title: "Brand identity",
    client: "Bloom & Co.",
    kind: "Branding",
    brief:
      "We are launching a flower delivery business called Bloom & Co. We need a logo and brand identity, a colour palette and typography guidelines. The brand should feel friendly and modern. We will supply the business name and a mood board. We have not set a budget or deadline. Packaging and a website may be needed in a future phase, not this project.",
    description: "Build a shared direction before the first concept.",
  },
  {
    title: "Booking platform",
    client: "Northside Studio",
    kind: "Web application",
    brief:
      "We need a booking web application for a fitness studio. Customers should see class availability, book a class and receive email confirmations. Staff need to manage sessions in an admin dashboard. It must work on mobile. We have not decided how to handle payments, cancellations or customer accounts. Launch timing and budget need discussion.",
    description: "Clarify the decisions hiding inside “simple booking”.",
  },
];
