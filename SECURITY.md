# Security

Pixel2Prompt does not ship with API keys. Do not commit `.env` files, Chrome profiles, captured page content, or screenshots of private sites.

## What stays on the device

Hover, highlight, section choice, the DOM and CSS snapshot, and the cropped PNG stay in the browser until you choose Generate prompt. The PNG is saved locally when you choose Save reference.png. It is not uploaded by the extension.

## What leaves the device

Only Generate prompt sends data, and only to the providers saved in Settings:

- Jev, when a Jev key is present: `POST https://api.typesafe.ai/v1/systemone` with the compact section snapshot. No image.
- Gemini or OpenAI, when an LLM key is present: one prompt-writing request. The body is the reconstruction instructions plus that same snapshot. No image and no base64.

Hover and selection make zero of these calls. A second click while a generation is running does not start another pair of calls. If Jev rejects the key, the LLM is not called.

## Keys

Keys live in `chrome.storage.local` under `pixel2prompt-settings`. They are sent only as `Authorization: Bearer` for Jev and OpenAI, or `x-goog-api-key` for Gemini. They are not placed in URLs, page content, prompts, or console logs. Error text is redacted before it is shown.

`.env.example` is a placeholder list. The extension never reads it.

## Permissions

The manifest asks for `sidePanel`, `activeTab`, `scripting`, and `storage`, plus host access limited to:

- `https://api.typesafe.ai/*`
- `https://generativelanguage.googleapis.com/*`
- `https://api.openai.com/*`

The content script is injected after you click Select section. It is not registered for every URL.

## Reporting

Report a security issue to [mail.buildsbyRD@gmail.com](mailto:mail.buildsbyRD@gmail.com). Please do not include live API keys in the report.
