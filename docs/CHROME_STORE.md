# Chrome Web Store

Pixel2Prompt is not published. This page is the submission checklist for when you choose to list it. Installing from source stays free. A store listing also installs for free. Model usage is billed to the keys the person saves in Settings.

## Developer account

Register a Chrome Web Store developer account and pay the one-time registration fee. Store review takes days, not minutes. Do not describe the extension as published until the listing is live.

## Package

1. Run `npm run build`.
2. Zip the contents of `dist`, not the repository and not `node_modules`.
3. Confirm the zip has no `.env`, no API key, and no Chrome profile.
4. Upload that zip in the developer dashboard. The manifest version is `0.1.0`.

`dist` is gitignored. Build it locally before you pack.

## Listing facts

Use these, and do not add permissions the manifest does not have.

- Name: Pixel2Prompt
- Summary: Capture a website section and turn it into a reconstruction prompt.
- Category: a productivity or developer-tools category that matches the dashboard choices.
- Single purpose: select one section of a page and write a reconstruction prompt with the user’s own API keys.
- Permissions to justify: `sidePanel`, `activeTab`, `scripting`, `storage`, and host access only to `api.typesafe.ai`, `generativelanguage.googleapis.com`, and `api.openai.com`.

Explain that the content script is injected after Select section, that capture uses the toolbar click, and that keys stay in local storage.

## Privacy fields

Match [docs/PRIVACY.md](PRIVACY.md):

- No account and no analytics.
- Data leaves the browser only after Generate prompt.
- The compact snapshot goes to the provider the user configured.
- The screenshot is not uploaded by the extension.
- Keys are not sent to a Pixel2Prompt server.

The store privacy form should say the same thing. Host the same policy text at a public URL if the form requires one. The contact address is mail.buildsbyRD@gmail.com.

## Review notes

Tell the reviewer how to try it without a key: Select section still works, and Generate prompt shows the missing-key message. Offer a test LLM key in the private reviewer notes if a full generation must be checked. Do not put that key in the repo or the public listing.
