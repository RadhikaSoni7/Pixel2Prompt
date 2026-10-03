# Pixel2Prompt

See It. Capture It. Rebuild It.

Developer: Radhika Dholakiya · mail.buildsbyRD@gmail.com

Pixel2Prompt is a Chrome extension for capturing one section of a website and turning it into a reconstruction prompt for Cursor, Claude Code, or Codex.

This version is the foundation: a Manifest V3 side panel, a background service worker, and a content script that confirms it can run on the current page. Highlighting, screenshots, and AI requests are not part of this build.

## Requirements

- Node.js 22 or newer
- Chrome 116 or newer

## Build

```bash
npm install
npm run build
```

## Load in Chrome

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose Load unpacked.
4. Select the `dist` folder in this project.

Click the Pixel2Prompt toolbar icon. The side panel opens. On a normal website, Select Section checks that the content script can run.

## Keys

Copy `.env.example` only as a local reminder of provider names. The extension never reads that file. Do not commit real API keys.

## License

MIT
