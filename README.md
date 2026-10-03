# Pixel2Prompt

See It. Capture It. Rebuild It.

Developer: Radhika Dholakiya · mail.buildsbyRD@gmail.com

Pixel2Prompt is a Chrome extension for capturing one section of a website and turning it into a reconstruction prompt for Cursor, Claude Code, or Codex.

This version selects one section of a page. Hover highlights a meaningful container, click captures its structure and a cropped reference screenshot, and the side panel shows the preview. AI requests are not part of this build.

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

Click the Pixel2Prompt toolbar icon. The side panel opens. On a normal website, choose Select Section, hover a region, and click it. The panel shows the section size and a reference image. Refresh the page after reloading the extension.

## Keys

Copy `.env.example` only as a local reminder of provider names. The extension never reads that file. Do not commit real API keys.

## License

MIT
