import { uid, type Scope } from "./model";
export function planBrief(brief: string): Scope {
  const sentences = brief
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const deferred =
    /\b(later|future|not part|isn[’']?t part|not this|out of scope|next phase)\b/i;
  const current = sentences.filter((s) => !deferred.test(s));
  const requirements = current.join(" ");
  const deliverables: Scope["deliverables"] = [];
  const questions: Scope["questions"] = [];
  const exclusions = sentences
    .filter(
      (s) =>
        deferred.test(s) ||
        /\b(?:do not need|do not want|do not require|don['’]t need|don['’]t want|without|no)\s+(?:an?\s+)?(?:booking|ecommerce|e-commerce|shop|CMS|logo|website|checkout|admin)/i.test(
          s,
        ),
    )
    .map((s) => ({ id: uid(), text: s }));
  const add = (
    title: string,
    description: string,
    criteria: string,
    re: RegExp,
  ) => {
    const evidence = current.find((s) => {
      const match = re.exec(s);
      if (!match) return false;
      const clause =
        s
          .slice(0, match.index)
          .split(/[,;]|\bbut\b|\bhowever\b/i)
          .at(-1) || "";
      return !/\b(?:do not (?:need|want|require)|don['’]t (?:need|want)|without|no|exclude)\b/i.test(
        clause,
      );
    });
    if (evidence)
      deliverables.push({
        id: uid(),
        title,
        description,
        criteria,
        evidence: evidence.slice(0, 1000),
        confirmed: false,
      });
  };
  add(
    "Responsive website",
    "Design and build the website described in the brief. Confirm the exact page list and supported devices before work starts.",
    "The agreed pages are implemented, reviewed at mobile and desktop widths, and approved against the agreed content.",
    /\b(website|web site|landing page)\b/i,
  );
  add(
    "Portfolio or content gallery",
    "Present the requested work or content in a navigable gallery. Confirm fields, image formats and initial content volume.",
    "Approved content can be browsed and each agreed detail view works without broken media.",
    /\b(portfolio|gallery|project photos)\b/i,
  );
  add(
    "Enquiry form",
    "Implement the requested enquiry flow with clear validation and submission feedback. Confirm delivery destination.",
    "Required fields are validated; successful submissions reach the agreed destination; failures provide recovery guidance.",
    /\b(contact form|enquiry|inquiry)\b/i,
  );
  add(
    "Content management",
    "Enable editing of the agreed content types. Confirm CMS choice, hosting and editor permissions.",
    "An authorised editor can create, update and publish the agreed content using documented steps.",
    /\b(CMS|content management|update .*ourselves)\b/i,
  );
  add(
    "Brand identity",
    "Develop the requested identity elements after confirming the deliverable list, concept directions and revision rounds.",
    "The agreed assets are approved and delivered in agreed formats with documented usage guidance.",
    /\b(logo|brand identity)\b/i,
  );
  // Existing logos do not imply a logo-design deliverable.
  if (
    /\b(have|existing|supply|supplied)\b.{0,25}\blogo\b/i.test(requirements) &&
    !/\b(need|design|create)\b.{0,25}\b(logo|brand identity)\b/i.test(
      requirements,
    )
  ) {
    const index = deliverables.findIndex((d) => d.title === "Brand identity");
    if (index >= 0) deliverables.splice(index, 1);
  }
  add(
    "Booking flow",
    "Define and implement the requested availability and booking journey. Confirm scheduling rules, cancellations and confirmations.",
    "An agreed test booking succeeds; unavailable slots cannot be booked; confirmation and cancellation behaviours match the approved rules.",
    /\b(booking|book a|bookings)\b/i,
  );
  add(
    "Commerce functionality",
    "Define and implement the requested shop journey. Confirm catalogue, fulfilment, payment and refund requirements.",
    "The approved product-to-order journey passes the agreed test cases; payment behaviour is verified in a test environment.",
    /\b(shop|ecommerce|e-commerce|online store|checkout)\b/i,
  );
  add(
    "Admin dashboard",
    "Provide the requested management interface. Agree roles, access controls and editable records.",
    "Approved staff roles can perform agreed actions; unauthorised users cannot access management functions.",
    /\b(admin|dashboard|staff .*manage)\b/i,
  );
  add(
    "Interface design",
    "Define the requested user flows and interface designs, with an agreed component and screen list.",
    "The agreed screens, states and interactions are reviewed and delivered with implementation notes.",
    /\b(UI\/UX|wireframes|prototype|app design|interface design)\b/i,
  );
  if (!deliverables.length)
    deliverables.push({
      id: uid(),
      title: "Define the primary deliverable",
      description:
        "The brief needs a more specific deliverable list. Replace this placeholder after discussing the requested outcome.",
      criteria:
        "The client and project owner agree the deliverable, its boundaries and how completion will be assessed.",
      evidence: current[0]?.slice(0, 1000) || "",
      confirmed: false,
    });
  const q = (text: string, required = true) =>
    questions.push({ id: uid(), text, answer: "", required });
  q("What is the agreed budget, and which ongoing costs are included?");
  q("What launch date is agreed, and what dependencies could affect it?");
  q("Who approves the work, and how many revision rounds are included?");
  if (/copy|content|photograph|image|portfolio/i.test(requirements))
    q("Who supplies final copy and images, and when will they be ready?");
  if (/booking|payment|account|admin/i.test(requirements))
    q(
      "What are the rules for payments, cancellations, user accounts and staff access?",
    );
  if (/CMS|hosting|website|web application/i.test(requirements))
    q("Who owns hosting, domain access, accounts and ongoing maintenance?");
  q("How will success be measured after launch?", false);
  const goals = current
    .filter((s) => /\b(should|goal|want|feel|easy|mobile|help|need)\b/i.test(s))
    .slice(0, 4)
    .map((text) => ({ id: uid(), text: text.slice(0, 2000) }));
  return {
    summary:
      current.slice(0, 3).join(" ").slice(0, 3000) || brief.slice(0, 3000),
    deliverables,
    questions,
    goals,
    assumptions: [
      {
        id: uid(),
        text: "Proposed: the client supplies or approves all required content and has rights to use it.",
      },
      {
        id: uid(),
        text: "Proposed: project dates and costs are confirmed after the open questions are resolved.",
      },
    ],
    exclusions: exclusions.length
      ? exclusions
      : [
          {
            id: uid(),
            text: "Proposed: ongoing maintenance, third-party subscriptions and work outside the agreed deliverables are excluded unless added explicitly.",
          },
        ],
    milestones: [
      {
        id: uid(),
        title: "Discovery & alignment",
        description:
          "Resolve the essential questions, confirm responsibilities and agree the scope.",
        days: null,
      },
      {
        id: uid(),
        title: "Direction & design",
        description:
          "Review the proposed approach, key flows and visual direction.",
        days: null,
      },
      {
        id: uid(),
        title: "Production & review",
        description:
          "Produce the agreed deliverables and verify their acceptance criteria.",
        days: null,
      },
      {
        id: uid(),
        title: "Handoff & sign-off",
        description:
          "Deliver agreed assets and documentation, then record final approval.",
        days: null,
      },
    ],
    mode: "assisted",
  };
}
