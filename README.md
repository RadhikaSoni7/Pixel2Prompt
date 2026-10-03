# Pixel2Prompt

See It. Capture It. Rebuild It.

Developer: Radhika Dholakiya · [mail.buildsbyRD@gmail.com](mailto:mail.buildsbyRD@gmail.com)

Pixel2Prompt is a free Manifest V3 Chrome extension. On a normal website, select one section, keep a reference PNG, and generate a reconstruction prompt for Cursor, Claude Code, or Codex.

There is no account, backend, or central API bill. You bring your own keys. Hovering and selecting a section stay on the device. Generate prompt sends one compact snapshot, with at most one Jev request and one LLM request.

This repository is the source. The extension is not listed on the Chrome Web Store yet.

## Requirements

- Node.js 22 or newer
- Chrome 116 or newer

## Setup

```bash
npm install
npm run build
```

Load the unpacked build:

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose Load unpacked.
4. Select the `dist` folder in this project.

Click the Pixel2Prompt toolbar icon. The side panel opens. After you reload the extension, refresh the page before selecting a section again.

`npm run dev` starts the local extension build. `npm run typecheck` runs the TypeScript check without emitting files.

## Use

1. Open a normal `http` or `https` page.
2. Click the toolbar icon, then Select section.
3. Hover a region and click it. Parent, Smaller, and Pick another adjust the selection. Lock section keeps the current one.
4. Choose a stack under Build with.
5. Choose Generate prompt.
6. Copy prompt, Save prompt.md, and Save reference.png. Attach the PNG when you paste the prompt into a coding agent.

## Bring your own keys

Open Settings in the side panel.

| Field | Required | Used for |
| --- | --- | --- |
| Jev API key | No | One classification request to TypeSafe System One |
| LLM provider | Yes, when generating | Gemini or OpenAI |
| LLM API key | Yes, when generating | The reconstruction prompt |

Keys are saved in Chrome local storage on this browser. They are not read from `.env`. Copy [`.env.example`](.env.example) only as a reminder of the provider names. Do not commit real keys.

Without a Jev key, Generate prompt still calls the LLM once. Without an LLM key, the panel asks you to add one and does not call the network. An invalid Jev key stops before the LLM is called.

## Screenshots

Demo images are not in this repository yet. When a real session is recorded, add them under `docs/screenshots/` and do not commit captures of private pages. The intended set is listed in [docs/DEMO.md](docs/DEMO.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Privacy](docs/PRIVACY.md)
- [Security](SECURITY.md)
- [Demo](docs/DEMO.md)
- [Chrome Web Store](docs/CHROME_STORE.md)

Diagrams: [architecture](diagrams/architecture.mmd), [user flow](diagrams/user-flow.mmd), [sequence](diagrams/sequence.mmd).

## Limitations

- `chrome://` pages, the Chrome Web Store, and cross-origin iframes cannot be captured.
- A section taller than the viewport is cropped to the visible portion.
- The toolbar click is required before capture. That grants `activeTab` for the current page.
- Generate prompt does not run on hover, on selection, or again by itself.
- The model receives a compact section snapshot, not the page HTML and not the PNG.
- The published package must not contain API keys. This source tree does not.

## License

[MIT](LICENSE)
