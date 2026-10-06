# Project review and improvements

The review covered the application page and layout, both API routes, all input and result components, error and loading states, prompts, JSON parsing, runtime validators, shared types, styles, dependencies, and setup documentation.

## Fixed

| Finding | Change |
| --- | --- |
| Caret and highlighted text used separate layers with inconsistent padding and font metrics | Replaced the overlay with CodeMirror; remeasure after local fonts load |
| Changing modes unmounted forms and discarded drafts | Keep forms mounted and persist independently validated drafts locally |
| A late response could update the screen after a mode change | Abort requests and guard every update by active request identity |
| No cancellation or timeout controls | Add a cancel action, bounded provider/browser timeouts, and real retry |
| Trimming source shifted review line numbers | Preserve source whitespace end to end; use trimming only to check emptiness |
| Invalid model output was classified as invalid user input | Return 502 for malformed provider results and 400 for invalid requests |
| Review issues could reference nonexistent source lines | Validate line references against submitted source |
| Fractional scores outside 0–100 could pass after rounding | Check the range before rounding |
| Provider error details were returned directly | Use actionable messages without raw provider details |
| Outdated Next.js and nested PostCSS dependencies | Upgrade Next.js and override its PostCSS with the patched direct dependency |
| Shared severity and score classes were outside Tailwind's scanned folders | Scan all source files so severity highlights and score colors are generated |
| No automated regression checks or project-specific README | Add unit/browser tests, GitHub Actions, setup instructions, and architecture notes |

## Added

Code editor navigation and shortcuts; language-specific examples; source-file import; comparison swapping; category filters and issue search; complete Markdown/JSON exports; local draft persistence; keyboard-accessible mode tabs; a source link.

## Validation boundaries

Unit tests mock the provider's transport and verify server behavior without making paid requests. Browser tests use mocked API responses to verify the interface and downloads. Desktop and mobile viewport tests check cursor geometry against actual rendered character bounds, typing, indentation, undo, horizontal scrolling, draft restore, imports, filtering, retries, and cancellation.

A real provider response must still be smoke-tested in the deployed environment with its configured API key, quota, and model. Mobile tests use Chromium with a mobile viewport, not a physical device or Safari.

## Remaining dependency findings

The production framework and PostCSS issues were addressed. Some transitive development tools still report vulnerabilities in glob-pattern and selector parsing. Their inputs here are repository-controlled files and build configuration. They remain tracked rather than forcing unverified major upgrades to Tailwind or its internals. Run `npm audit` periodically and recheck after upstream releases.

Authentication, a distributed rate limiter, cloud history, and code execution are outside this update. The application currently submits snippets to a server-side AI provider; it does not run user code.
