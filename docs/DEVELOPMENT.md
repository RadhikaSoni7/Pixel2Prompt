# Development

## Setup

```bash
npm install
npm run dev
```

Load `dist` from `chrome://extensions` with Developer mode on. Chrome ignores a command-line load for this branded install, so use Load unpacked.

After each reload of the extension, refresh the page. The content script is injected when you choose Select section, and an old page can still be holding the previous listener.

## Scripts

| Script | Command |
| --- | --- |
| Dev build | `npm run dev` |
| Typecheck | `npm run typecheck` |
| Production build | `npm run build` |

`npm run build` runs `tsc --noEmit` and then Vite. The loadable extension is the `dist` folder. `dist` is gitignored.

## Tests

Unit tests use the Node test runner and are excluded from the extension typecheck:

```bash
node --experimental-strip-types --test src/ai/generate.test.ts src/content/choose-section.test.ts
```

Those tests cover section choice, the one-Jev-then-one-LLM budget, a missing LLM key, invalid-key messages that do not echo the key, and the single-flight lock.

## Layout

```text
src/sidepanel/     panel UI
src/background/    service worker
src/content/       selection on the page
src/analyzer/      snapshot and crop frame
src/ai/            Jev and LLM calls
src/storage/       BYOK settings
src/types/         extension messages
public/            logo and toolbar icons
```

Style in the existing TypeScript files: strict types, no semicolons.

## Keys while developing

Use Settings in the panel. Do not put real keys in `.env` or in source. `.env.example` documents the names only.

## Checks before a release commit

```bash
npm run build
node --experimental-strip-types --test src/ai/generate.test.ts src/content/choose-section.test.ts
```

Confirm `dist` contains no API keys, and that hover and selection code does not reference the provider hosts.
