# Validation · 17 November 2026

The project includes automated checks for planner behaviour, readiness, exports,
imports, local-storage recovery, the provider endpoint and UI interactions.

## Passed during implementation

- 28 tests across core logic, the server endpoint, and simulated-DOM UI workflows.
- TypeScript compilation and the production Vite/Worker build.
- Production smoke checks for the page, referenced assets, headers, health, local
  analysis endpoint and missing assets.
- Production dependency audit: zero reported vulnerabilities at validation time.

The UI interaction suite uses React Testing Library and a simulated DOM. It
covers creating a draft, generating from the studio example, editing and saving
the summary, rendering its preview, changing themes, restoring drafts, basic
dialog operation and the essential review gate. Native dialogs are stubbed in
the simulated DOM; real browser focus trapping is not established by those tests.

The production smoke test executes the built Worker to check document delivery,
referenced JS/CSS, security headers, health, the no-key analysis path and missing
asset handling.

## Verification limits

- The managed preview CLI failed with “relay could not open browser port 4173:
  timed out waiting for relay readiness”. No separate preview server or alternate
  browser-control path was started to bypass that infrastructure.
- Interactive browser visual checks, mobile layout checks, native file downloads,
  clipboard permissions and actual print/PDF pagination remain unverified here.
- Live APInex output is unverified because no provider key was supplied. Provider
  success and failure paths are tested with controlled mock responses. The default
  application uses local analysis and labels it accordingly.

Before public promotion, review both themes on desktop and phone, print a long
scope, exercise the JSON export/import UI, and verify keyboard/focus behaviour in
a native browser. Keep the local fallback enabled when adding a free provider key.
