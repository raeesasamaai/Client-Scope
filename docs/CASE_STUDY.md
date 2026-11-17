# ClientScope — from a vague request to a shared plan

## Problem

Small projects often start with informal messages: “a simple website”, “a booking
feature”, or “something modern”. The uncertainty sits in content responsibilities,
review rounds, ongoing costs, access and acceptance criteria. A polished brief-to-
scope tool should make those decisions visible while keeping the user in control.

## Experience

The workflow is brief → editable scope → handoff preview. The first screen offers
a real empty state and three working starter briefs. The right-hand inspector
explains the workflow, then becomes a readiness checklist within a project.

The supplied visual reference informed the rounded panels, layered illumination
and three-column workspace. #09967e anchors a teal/mint/sage gradient. Dark mode
uses deep green-charcoal surfaces; light mode uses off-white panels and darker
teal text. Primary buttons use a deeper teal for readable white labels. A
procedural CSS orb provides a visual focal point without an external image API.

## Decisions

- Local analysis works immediately and is labelled honestly. Optional AI enhances
  it when the owner configures a key; missing credentials never block the tool.
- Every deliverable has acceptance criteria and a separate review checkbox.
- Source evidence is quoted where available. AI evidence must occur verbatim in
  the brief or is removed before display.
- Clarification answers stay blank until entered by the owner. No invented
  budget, duration or signed approval is supplied by the system.
- Existing or deferred features are handled separately where the rule-based
  parser recognises them. Ambiguous language remains a review responsibility.
- Edits invalidate the ready flag; a changed brief also invalidates readiness.
- JSON exports are portable editable backups. Imports become separate drafts
  with fresh identifiers so they do not overwrite the existing workspace.
- Local saving is isolated behind an adapter to allow future cloud persistence.

## Technical implementation

React and TypeScript drive the workspace. Tailwind CSS and custom theme variables
provide the responsive surfaces and print layout. Framer Motion is limited to
navigation transitions and respects reduced motion. Schema validation covers
stored documents, imports and AI responses. A self-contained Worker serves
static assets and a bounded, same-origin provider endpoint.

## Evidence and limits

Automated tests cover local proposal generation, deferred/existing/negated
requirements, readiness, Markdown output, JSON import round trips, corrupted
storage, AI response normalisation and fallback, plus DOM workflows for creating,
editing, reviewing and previewing a scope. These do not substitute for real-device
visual checks. The precise validation boundary is recorded in VALIDATION.md.

No customer interviews, usage metrics, time-saved claims or conversion improvements
have been invented. A next iteration should observe whether real freelancers can
identify missing decisions and prepare a scope without guidance.

This project uses AI-assisted development. Before presenting it in interviews,
review and understand the state model, parser limits, readiness rules, privacy
boundary and deployment choices.
