# Engineering notes

## Editor and review integrity

CodeMirror owns text, highlighting, selection, and cursor measurement in a single document. Font loading triggers remeasurement. Formatting uses a history transaction, preserves source on parse failure, and discards stale formatting results if the document changes while parsers load.

Submitted source is preserved, including leading whitespace. The review API validates issue line numbers against that exact source. Results and exports use the submitted snapshot, while category filters affect presentation only. Review suggestions may contain explanations; they are not automatically applied as patches.

The local comparison diff shows actual changes between Solution A and Solution B. Its computation has a short time budget and falls back to showing complete removal/addition for pathological input.

## Request and deployment boundaries

Both API routes share access checks, bounded JSON reading, provider configuration, and error translation:

- Production analysis is disabled unless a private deployment access token is configured.
- Tokens are compared using constant-time SHA-256 digest comparison.
- Browser origins are compared against the actual Host header, including the port, rather than Next.js's normalized request URL. Vercel's forwarded protocol is used only on Vercel; requests from different origins are rejected.
- Actual streamed bodies are limited to 128 KiB, even without an accurate Content-Length.
- The provider has a 45-second timeout and zero automatic retries, within a 60-second Vercel function budget.
- API responses are marked no-store; provider details, source, and credentials are not logged by the application.
- Cancelled and superseded requests cannot update the current workspace.

A shared token restricts a portfolio demo. Individual authentication, distributed rate limits, and per-user budgets remain future work. Cancellation cannot guarantee that provider computation or charges have stopped.

## Privacy and samples

New visitors opt in to local draft storage. Disabling saving removes the corresponding stored source while preserving the in-memory document. Existing saved drafts are migrated to avoid losing work. Writes are debounced and stored data is validated after hydration.

Curated sample reports use synthetic TypeScript snippets, make no provider request, and identify their provenance in the interface and exports. Live analysis still requires configured provider credentials, model access, and quota.

## Verification

Unit checks cover request validation, production access guards, stream-size limits, malformed provider results, source preservation, diff line numbers, formatting, samples, and report generation.

Browser checks cover cursor geometry, keyboard navigation, indentation, undo, horizontal scrolling, responsive layout, import limits, filtering, exports, request retry/cancellation, formatting undo, source download, sample provenance, opt-in storage/deletion, and access-code handling. Tests use synthetic data and mocked provider responses. Separate unmocked requests with invalid input exercise both real API routes and verify that Next.js loopback normalization does not reject same-origin browser requests; these requests cannot reach the paid provider.

The production build is exercised in CI. Browser projects cover desktop Chromium and an emulated mobile viewport; physical devices, Firefox, and WebKit are not covered yet. A live provider response has not been verified as part of these mocked checks.

## Dependency maintenance

Next.js is pinned to the patched 15.5.28 release. PostCSS and its selector parser are overridden to patched versions; the production build and browser styling checks cover the resulting Tailwind output. The dependency audit reported zero findings when this update was verified. Future registry advisories may change that result.
