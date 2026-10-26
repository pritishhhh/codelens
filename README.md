# CodeLens

[![CI](https://github.com/pritishhhh/codelens/actions/workflows/ci.yml/badge.svg)](https://github.com/pritishhhh/codelens/actions/workflows/ci.yml)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpritishhhh%2Fcodelens)

**A browser workspace for editing code, understanding tradeoffs, and getting structured review feedback.**

CodeLens brings a real code editor, local source comparison, and AI-assisted review into one interface. It supports JavaScript, TypeScript, Python, Java, C++, and Go. Curated sample reports make the complete review and comparison experience available without an API key.

![CodeLens workspace](docs/preview.png)

[View the comparison workspace](docs/comparison.png)

## What it does

- **Edit comfortably:** CodeMirror 6 provides syntax highlighting, line numbers, bracket matching, completion, folding, search and replace, indentation, and undo/redo. Line wrapping and adjustable font sizes accommodate different screens.
- **Format locally:** JavaScript/JSX and TypeScript/TSX formatting uses lazily loaded Prettier parsers. Formatting is undoable; invalid syntax leaves the original source intact.
- **Work with files:** Import source files with language detection and normalized line endings, copy code, or download the current source in its selected language.
- **Review code:** Get a quality score, line-specific issues grouped by severity, category filters, search, and suggested fixes beside the submitted source.
- **Compare solutions:** Edit two snippets, swap them, inspect a local line diff, and request an analysis of correctness, performance, readability, and maintainability.
- **Try sample reports:** Explore curated TypeScript reviews and comparisons without contacting an AI provider. Samples are clearly identified in the interface and exported reports.
- **Keep control of drafts:** Documents stay in memory by default. Optional local saving restores drafts after reload; switching it off removes the stored source for that draft.
- **Export findings:** Download Markdown or JSON containing the original submitted source and complete feedback, independent of active filters.
- **Manage requests:** Cancel work, retry a failed submission, and switch modes without stale responses changing the current view.
- **Navigate accessibly:** Named editors, keyboard-operated mode tabs, focus indicators, a skip link, responsive layouts, and reduced-motion support.

CodeLens reviews snippets; it does not compile or execute them. The annotated review displays suggestions, which may be explanations rather than directly applicable patches. The comparison source diff shows actual text changes between the two documents.

## Technology

Next.js 15 App Router · React · TypeScript · Tailwind CSS · CodeMirror 6 · Prettier · jsdiff · OpenAI Node SDK · Playwright · Node test runner

The API key remains on the server. Formatting, text comparison, imports, downloads, draft storage, and sample reports run locally in the browser.

## Run locally

Requirements: **Node.js 22.13+ (22.x LTS) or 24+**, and npm. The repository includes an `.nvmrc` for Node 22.

```bash
git clone https://github.com/pritishhhh/codelens.git
cd codelens
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The editor and sample reports work immediately without environment variables.

Live AI analysis requires a server-side API key:

```bash
cp .env.example .env.local
```

On PowerShell, the equivalent is `Copy-Item .env.example .env.local`.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Server-only provider key for live analysis. Never use a `NEXT_PUBLIC_` prefix. |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-4o`. Must support Chat Completions and JSON object output. |
| `CODELENS_ACCESS_TOKEN` | Private deployment access code. Required for live AI in production; optional during local development. |

Restart the development server after changing environment variables. When an access token is configured, enter it in **Live AI access** in the workspace. The code is held in memory for the current visit and sent only with analysis requests.

## Deploy on Vercel

The repository includes `vercel.json`, uses the Next.js framework preset, and builds without an API key or external database.

1. Import this GitHub repository into Vercel, or use the deploy button above.
2. Select **Node.js 22.x** and keep the repository root as the project directory.
3. For live analysis, configure `OPENAI_API_KEY` and a long, random `CODELENS_ACCESS_TOKEN` as server environment variables. `OPENAI_MODEL` is optional.
4. Deploy. Subsequent pushes to the connected branch trigger Vercel builds.

Without a production access token, live analysis returns 503 and the editor and sample reports remain usable. This prevents an accidental public deployment from exposing an unrestricted paid AI endpoint. The access code can be shared privately with intended reviewers; it is separate from the provider API key.

Both API routes use the Node.js runtime with a 60-second maximum duration. Provider requests have a 45-second timeout with automatic retries disabled. Responses containing analysis are marked `no-store`. A static-only export cannot run the API routes.

For another Node-compatible host:

```bash
npm run build
npm start
```

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Review or compare | Ctrl/Cmd + Enter |
| Undo / redo | Ctrl/Cmd + Z / Shift + Ctrl/Cmd + Z |
| Find / replace | Ctrl/Cmd + F, then expand the replace controls |
| Indent / outdent | Tab / Shift + Tab |
| Leave the editor | Escape, then Tab |
| Change mode with a tab focused | Left / Right arrow, Home / End |

Snippets are limited to **10,000 characters each**. Example and sample buttons replace the current snippet or comparison pair.

## Architecture and engineering choices

```text
src/app/                 Workspace, layout, and server-only API routes
src/components/          Editors, source diff, forms, feedback, and exports
src/hooks/               Validated, opt-in draft persistence
src/lib/                 Prompts, request guards, validators, formatting, diffing, and samples
src/types/               Shared TypeScript request/result contracts
tests/unit/              API boundaries, runtime contracts, reports, diffing, and formatting
tests/e2e/               Desktop and mobile browser workflows
```

- **Request lifecycle:** Abort controllers and request identity checks prevent cancelled or superseded work from updating the screen. Retry uses the submitted snapshot, preserving its source and line numbers.
- **Runtime validation:** Request and model output are validated separately. Invalid input returns 400, oversized request bodies return 413, and malformed provider output returns 502. Review issues must reference a line in the submitted source.
- **Deployment protection:** Production live analysis requires a shared access token. Comparisons use constant-time digest checks. Cross-origin browser analysis requests are rejected, actual body streams are bounded to 128 KiB, and provider error details are never returned.
- **Editor integrity:** CodeMirror owns document text, highlighting, selection, and cursor measurement. Formatting is a history transaction and skips results if the document changed while parsers were loading.
- **Local persistence:** Saved drafts are validated after hydration and writes are debounced. Existing saved drafts are migrated; new visitors explicitly opt in. Storage restrictions leave the editor usable.
- **Honest samples:** Curated sample data never impersonates a live response. Sample provenance appears in Markdown and JSON exports.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs lint, type checking, unit tests, a production build, and browser tests on pushes and pull requests to `main`. Browser coverage includes desktop Chromium and a mobile viewport. Tests use synthetic data and mocked AI responses; they do not require a provider key or spend credits.

## Privacy and limitations

Source is sent to OpenAI only when live analysis is submitted. Imports, formatting, samples, and local diffs do not transmit source. Optional saved drafts are plaintext in this browser's storage. Turning saving off removes that draft's stored source, while preserving the current editor contents until the page is closed or reloaded.

AI feedback may be incorrect or incomplete; it needs human review. Cancelling a request cannot guarantee cancellation of provider work or charges already incurred. Both comparison snippets use one selected language. Mobile tests use a Chromium viewport rather than a physical device or Safari.

A shared access code is suitable for a restricted portfolio demo, not a substitute for individual accounts, distributed rate limits, or per-user quotas. Provider spending controls and deployment access policies remain relevant for a public service.

## Further improvements

- **Multi-file workspaces:** A file tree, tabs, cross-file search, and project imports with explicit size and privacy limits.
- **Language intelligence:** Language Server Protocol integration for diagnostics, completion, symbol navigation, and refactoring; formatters for Python, Java, C++, and Go.
- **Review context:** Structured problem descriptions, selected review rules, and schema-constrained model responses with evidence linked to source.
- **Accounts and quotas:** Individual authentication, distributed rate limiting, per-user usage budgets, and an audit trail that avoids storing source by default.
- **Review history:** Opt-in encrypted cloud storage, saved comparisons, and report history with deletion controls.
- **Testing depth:** Firefox and WebKit coverage, automated accessibility audits, larger-diff performance checks, and a small provider evaluation set.
- **Collaboration:** GitHub pull-request imports, anchored discussion threads, and explicit approval before writing comments.
- **Execution sandbox:** Isolated, resource-limited runners with no host or network access, if code execution becomes part of the product.
