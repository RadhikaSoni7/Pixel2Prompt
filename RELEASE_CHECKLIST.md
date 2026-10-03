# Pixel2Prompt 1.0.0 release checklist

Version `1.0.0` is packed for a manual Chrome Web Store submission. Nothing in this repository publishes the listing. Do not submit until you have finished the manual steps below.

Store package: `release/pixel2prompt-1.0.0.zip`  
Unpacked build: `dist/`

## Audit

| Check | Result |
| --- | --- |
| `npm run build` | Passed. `dist/manifest.json` version is `1.0.0`. |
| Extension loading | Manual. Load `dist` from `chrome://extensions`. Branded Chrome ignores a command-line load. |
| Selection | Unit tests cover section choice. Hover and click on a real page are manual. |
| Screenshot | The panel crops a `captureVisibleTab` PNG. Confirm it on a public page after the toolbar click. |
| Prompt | Generate prompt writes one reconstruction prompt from the compact snapshot. |
| BYOK | Keys are entered in Settings and stored in `chrome.storage.local`. `.env` is not read. |
| Jev | Optional. One request to `https://api.typesafe.ai/v1/systemone`. A failure does not call the LLM. |
| LLM | One request, plus one Gemini retry if the API names a replacement model. Gemini `gemini-3.5-flash-lite` or OpenAI `gpt-4o-mini`. |
| Copy | Copy prompt uses the clipboard from the button click. |
| Download | Save prompt.md and Save reference.png use a link click. No `downloads` permission. |
| Errors | Missing LLM key: no fetch. Invalid Jev key: Jev message, no LLM call. Invalid LLM key: provider message, key redacted. |
| Permissions | `sidePanel`, `activeTab`, `scripting`, `storage`. Hosts: TypeSafe, Gemini, OpenAI only. |
| Secrets | No live API keys in the tree or in git history. The test fixture string `secret-key-value` is fake. |
| `.env` | No `.env` file. `.env.example` has empty placeholders. `.env` and `.env.*` are gitignored, with `.env.example` allowed. |
| Git history | Six commits before this release commit. History search found no `AIza`, `sk-`, or `ghp_` tokens, and no filled-in key assignments. |
| README | Homepage states the product, the request budget, and that the store listing is not live. |
| Diagrams | `diagrams/architecture.mmd`, `diagrams/sequence.mmd`, and `diagrams/user-flow.mmd`. The same architecture and sequence diagrams are in the README so GitHub can render them. |

Automated tests:

```bash
node --experimental-strip-types --test src/ai/generate.test.ts src/content/choose-section.test.ts
```

Those tests passed: 13 of 13. They check the picker, the one-Jev-then-one-LLM budget, a missing LLM key, redacted invalid-key errors, and the single-flight lock.

## 1. Load the unpacked extension

1. In this repository, run `npm install` if you have not already.
2. Run `npm run build`.
3. Open Chrome and go to `chrome://extensions`.
4. Turn on Developer mode.
5. Click Load unpacked.
6. Choose the `dist` folder inside this project. Do not choose the repository root.
7. Confirm the card says Pixel2Prompt `1.0.0`.
8. Pin Pixel2Prompt if you want the icon visible.
9. If you reload the extension later, refresh any page you already had open before selecting a section again.

## 2. Test it

Use a public `https` page. Do not test on `chrome://` pages or the Chrome Web Store.

1. Click the Pixel2Prompt toolbar icon. The side panel opens. That click grants `activeTab` for this tab.
2. Choose Select section. Drag a rectangle around a region, like the Snipping Tool. The page should make no request to TypeSafe, Gemini, or OpenAI.
3. Release the drag. The panel should show the selector, size, element count, and a cropped reference image of that rectangle.
4. Try Parent, Smaller, Pick another, and Lock section.
5. Open Settings. Save a Gemini or OpenAI key. Leave Jev empty. Return and choose Generate prompt. Expect one LLM request and a prompt.
6. Save a Jev key and generate again on a new selection. Expect one Jev request, then one LLM request.
7. Choose Copy prompt and paste it into a text field. It should match the panel text and must not contain your API key.
8. Choose Save prompt.md and Save reference.png. Open both files. The PNG is the reference image. The markdown is the prompt.
9. Clear the LLM key and choose Generate prompt. The panel should tell you to add a key, and the network panel should stay quiet.
10. Put `invalid-key-test` in the Jev field, keep a real LLM key, and generate. The error should mention Jev, not the key text, and the LLM host should not be called.
11. Replace the LLM key with `invalid-key-test`, clear Jev, and generate. The error should mention the LLM provider and must not echo the key.

Pass this list before you upload.

## 3. Create a Chrome Web Store developer account

1. Sign in to Chrome with the Google account that should own the listing.
2. Open the [Chrome Web Store developer console](https://chrome.google.com/webstore/devconsole).
3. Accept the developer agreement.
4. Pay the one-time registration fee. Installs stay free. Model calls are billed to each person’s own keys.
5. Wait until the account is allowed to create items. This is separate from extension review.

Do this yourself. This repository cannot create the account.

## 4. Upload the ZIP

1. In the developer console, create a new item.
2. Upload `release/pixel2prompt-1.0.0.zip`.
3. The zip root must contain `manifest.json`, not a nested project folder.
4. Confirm the package version is `1.0.0`.
5. Do not upload the git repository, `node_modules`, `.env`, or `logo.png` from the repository root. The zip is only the built extension.

If you rebuild, run `npm run build` again and replace the zip from the new `dist` folder before uploading.

## 5. Complete the store listing

Use the developer console fields. Suggested copy:

- Name: Pixel2Prompt
- Summary: Capture a website section and turn it into a reconstruction prompt.
- Description: Select one section of a website, keep a reference PNG, and generate a reconstruction prompt for Cursor, Claude Code, or Codex. Keys stay on the device. Generate prompt sends only a compact snapshot to the provider you configure.
- Category: the developer-tools or productivity category the console offers.
- Language: English.
- Icon: the 128px icon already in the package.
- Screenshots: add at least one real public-page capture after you record the demo. Do not upload private pages.

Permission justifications:

- `sidePanel`: the product UI.
- `activeTab`: capture the tab you clicked the icon on.
- `scripting`: inject the selection script after Select section.
- `storage`: save Jev and LLM keys locally.
- Host access: `api.typesafe.ai`, `generativelanguage.googleapis.com`, and `api.openai.com` only, and only after Generate prompt.

Leave the item as a draft until the privacy form is done.

## 6. Complete the privacy declaration

Match [docs/PRIVACY.md](docs/PRIVACY.md):

- No account.
- No analytics and no telemetry.
- Data is not sold.
- Page content is not sent while hovering or selecting.
- After Generate prompt, the compact section snapshot is sent to TypeSafe if a Jev key is saved, and to Gemini or OpenAI for the prompt.
- The screenshot is not uploaded by the extension.
- API keys are stored in Chrome local storage and are not sent to a Pixel2Prompt server.
- Contact email: mail.buildsbyRD@gmail.com.

If the form requires a public privacy-policy URL, publish the same text from `docs/PRIVACY.md` at a URL you control and paste that URL. Do not invent a policy that claims a backend.

## 7. Submit for review

1. Read the listing and the privacy form once more.
2. In the private reviewer notes, explain that Select section works without a key, and that Generate prompt needs the reviewer’s own LLM key. If you share a test key, put it only in those private notes.
3. Click Submit for review yourself.
4. Review takes days. Do not describe Pixel2Prompt as published until the listing is live.
5. After approval, add the real store URL to the README. Until then, the README link stays on `docs/CHROME_STORE.md`.

Stop here. Do not publish from CI, and do not mark the listing public before review finishes.
