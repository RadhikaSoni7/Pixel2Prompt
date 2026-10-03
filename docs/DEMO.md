# Demo

Record the demo from a real page after `npm run build` and Load unpacked. Do not add screenshots to git until that recording exists. Do not capture private dashboards, inboxes, or accounts.

The extension is not on the Chrome Web Store. The demo should show an unpacked install.

## Before you record

1. `npm install` and `npm run build`.
2. Load `dist` at `chrome://extensions`.
3. Open Settings and save your own keys. Leave Jev empty if you want to show the LLM-only path.
4. Open a public page. Click the Pixel2Prompt icon so the panel is attached to that tab.
5. Refresh the page if you reloaded the extension after it was already open.

## What to show

1. The idle panel: Pixel2Prompt, See It. Capture It. Rebuild It., and Select section.
2. Drag a rectangle around one section, the same way you use the Snipping Tool. Release to capture. Press Esc to cancel. No network call is made.
3. The panel shows the selector, size, element count, and the cropped reference.
4. Parent or Smaller, then Lock section.
5. Generate prompt. The button moves from analyzing to writing, then the prompt, character count, and thumbnail appear.
6. Copy prompt, Save prompt.md, and Save reference.png.
7. Paste the prompt into a coding agent and attach the PNG.

Optional: clear the LLM key and show the Settings message with no request. Optional: an invalid Jev key stops before the LLM call.

## Screenshot placeholders

Add these files only after a real demo. Keep them free of secrets and of other people’s private pages.

| File | Frame |
| --- | --- |
| `docs/screenshots/idle.png` | Side panel before a selection |
| `docs/screenshots/hover.png` | Highlight on a public page |
| `docs/screenshots/captured.png` | Section card, prompt, and reference thumbnail |
| `docs/screenshots/settings.png` | Settings with empty key fields |

Until those files exist, the README does not embed them.
