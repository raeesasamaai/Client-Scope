# ClientScope

**A clearer start to every project.** Turn a rough client brief into editable deliverables, acceptance criteria, clarification questions, assumptions, exclusions, and milestones.

A functional portfolio MVP created for **Raeesa Samaai**, using React, TypeScript, Tailwind CSS, and Framer Motion. The interface takes inspiration from the supplied rounded, softly illuminated workspace reference and uses **#09967e** with mint, sage and warm lime accents. Both light and dark themes are included and remembered locally.

## What works

- Create, rename, search, reopen, and remove project scopes.
- Start from a blank brief or one of three authored example briefs.
- Paste a brief or import a `.txt` / `.md` file.
- Generate a complete draft with local, rule-based analysis; no account or API key required.
- Optionally request AI-enhanced analysis through a server-side APInex endpoint.
- Edit every section, add/remove items, record answers, and review deliverables individually.
- Reorder milestones and optionally enter estimated working days.
- Track review readiness; essential questions and deliverable reviews must be completed before marking ready.
- Detect when the brief changes after a scope was generated.
- Preview the handoff document, copy/export Markdown, export/import editable JSON, and print/save PDF using the browser print dialog.
- Save drafts automatically in this browser, with explicit storage-failure warnings.
- Responsive navigation, native modal dialogs, accessible labels, keyboard controls and reduced-motion support.

**Local analysis is available immediately. Live AI is not configured in the initial deployment because no provider key was supplied.** The UI labels the actual analysis mode and falls back to a local draft if AI is unavailable. No paid fallback exists.

## Quick start

Use Node.js **22 or later** and npm.

```sh
npm ci
npm run dev
```

Open Vite's printed local URL. This runs the complete browser workspace. AI requests gracefully fall back to local analysis because Vite does not run the production Worker.

For the full production app and optional API endpoint locally:

```sh
npm run build
npx wrangler dev
```

Open the local URL printed by Wrangler. Local Worker development does not require a Cloudflare login.

## Try the main workflow

1. Select **Try an example** on the overview screen.
2. Read or modify the studio brief, then select **Create my scope**.
3. Open **Deliverables**. Refine the proposed descriptions/criteria and select **Reviewed by me** for each item.
4. Open **Questions** and record the essential answers.
5. Open **Milestones** to reorder phases or enter estimated working days. Blank durations remain “to be agreed”.
6. Once all checks pass, select **Mark ready for review**. This means owner review, not client approval.
7. Preview and export. Keep an editable JSON backup so you can restore work in another browser.

Regeneration requires explicit confirmation because it replaces scope edits, answers and milestone order. It retains the source brief. Editing a reviewed scope returns it to draft status.

## Analysis behaviour

The local planner recognises common English website, portfolio, contact-form, CMS, brand, booking, commerce, dashboard and UI/UX requirements. It quotes the brief as evidence for proposed deliverables, distinguishes common existing/deferred/negated features, and supplies proposed acceptance criteria and discovery questions. It leaves dates, durations, budgets and answers uncommitted.

This is a **rule-based planning aid**, not general language understanding. Complex mixed clauses, unusual terminology or implicit requirements can be missed. All output needs review; users can add, correct or remove any suggestion. Unsupported briefs receive a discovery placeholder rather than an invented deliverable list. Local data never needs to leave the device.

## Optional free AI configuration

1. Confirm that your APInex account can access a current `free/*` model without a purchase or subscription. Free provider availability and quotas can change.
2. Copy `.env.example` to `.dev.vars` and enter your key for local Worker development.
3. Keep `APINEX_MODEL` set to a free model your account can access. The default is `free/claude-opus-4.6`.
4. Build and run `npx wrangler dev`.
5. Explicitly enable **Enhance with AI** in the Brief tab before generation.

For Cloudflare deployment, set the key using:

```sh
npx wrangler secret put APINEX_API_KEY
```

For Sites hosting, set the same runtime secret through the Site's environment-variable settings/tool. **Never commit a real key or expose it in a `VITE_*` variable.**

The model and upstream URL are fixed server-side. The endpoint rejects model names without a `free/` prefix, but a model name alone does not guarantee the provider's billing terms. Leave paid billing disabled and verify actual account eligibility. A model error, unavailable quota, invalid result, timeout, or missing key produces a usable local draft.

AI output is schema-validated. Deliverables are always returned unconfirmed; question answers and milestone durations are reset; non-verbatim evidence is removed. AI output can still contain mistakes and needs human review.

## Deployment

The [private Sites review version](https://clientscope-raeesa.silkyfoal64.chatgpt.site) requires the owner's ChatGPT sign-in. It is **not yet a public recruiter demo**. The source repository is public.

The build generates a self-contained Worker ES module at `dist/server/index.js`, embedding the UI, fonts and licence files. It requires no asset binding. `.openai/hosting.json` records the existing Site identity and contains no secrets.

To deploy on your own **Cloudflare Workers Free plan**:

```sh
npx wrangler login
npm run deploy:cloudflare
```

Use the free `workers.dev` address to avoid buying a domain. Check the provider's current free-plan limits before deploying. The app needs no database or paid service for its local workflow.

## Checks

```sh
npm test        # planner, state validation, exports, server and DOM interaction tests
npm run build  # TypeScript + Vite + standalone Worker
npm run check  # tests, build, and production-bundle smoke checks
```

GitHub Actions runs `npm ci` and `npm run check`. It does not deploy and requires no cloud-provider secret. See [docs/VALIDATION.md](docs/VALIDATION.md) for what was and was not verified.

## Project structure

```text
src/App.tsx                  Workspace, navigation, generation, saving and exports
src/components/ScopeEditor   Editable scope sections and milestone ordering
src/components/Preview       Printable document
src/components/Dialog        Native focus-managed dialogs
src/lib/model.ts             Schemas, document types and readiness calculation
src/lib/planner.ts           Pure local planner and proposal generation
src/lib/storage.ts           Validated local storage and portable imports
src/lib/export.ts            Markdown and download helpers
src/lib/api.ts               Optional analysis adapter with local fallback
server/worker.ts             Static delivery and protected provider integration
scripts/build-server.mjs     Self-contained production bundle
scripts/smoke-test.mjs        Production document/API checks
```

The editor is loaded on demand. Core project data is independent of the presentation layer, allowing a cloud storage adapter, new analysis provider or additional export format to be added later.

## Privacy and MVP boundaries

- Drafts are stored in localStorage, **not cloud-synchronised or encrypted**. This is a personal-device workspace; export backups before clearing site data or switching devices.
- No analytics or application account system. The private review host has its own ChatGPT access gate.
- AI is opt-in per session. With a configured provider key, enabling it sends the brief to APInex. Obtain permission before entering sensitive client information. Hosting/provider request logs are outside the app's local storage.
- Basic narrator request quotas are per Worker isolate (2 requests/IP/minute, 4 total/minute), not a durable global abuse limit. Add a durable quota or Turnstile before broad public promotion. Keep local analysis available.
- Maximum 100 scopes per browser, 10,000 characters per brief, and 250 KB per imported scope. Browser storage quotas may be reached earlier; failed saves are surfaced.
- PDF export uses the browser print dialog, not a paid PDF API. Actual pagination depends on browser, print settings and content.
- “Ready” records owner review only. This is a planning document, not a signed agreement, cost quotation or legally binding client acceptance.
- No external document scraping, automatic email sending, shared client portal or signatures in this MVP.

## Upgrade path

Add version snapshots and change comparisons, richer brief parsing, a reusable clause library, cloud saves and client review links. Add authentication and per-project permissions before collaborative access. Introduce paid integrations only as optional features with explicit budgets and provider terms.

The portfolio design rationale is in [docs/CASE_STUDY.md](docs/CASE_STUDY.md).

## Credits

Original application code and procedural CSS illustration: MIT, see `LICENSE`. Fonts: Manrope and Outfit, SIL Open Font Licence. Icons: Lucide, ISC. Third-party licence texts are distributed in `public/licenses/`.

Created for [Raeesa Samaai](https://github.com/raeesasamaai), with AI-assisted development. No fabricated client feedback or user-research outcomes are presented.
