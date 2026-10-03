# Privacy

Pixel2Prompt has no account, no analytics, and no telemetry. Nothing is sent to a Pixel2Prompt server, because there is not one.

## Stored on this browser

Settings store three values in Chrome local storage:

- Jev API key, if you save one
- LLM provider: Gemini or OpenAI
- LLM API key, if you save one

Clear in Settings removes them. Uninstalling the extension removes the extension’s local storage.

The reference PNG and the prompt exist in the side panel for the current capture. Save reference.png and Save prompt.md write files you choose to keep. The extension does not upload those files.

## Sent only when you generate

Hovering and clicking a section do not leave the device.

Generate prompt sends the compact section snapshot:

- To TypeSafe (`https://api.typesafe.ai`) when a Jev key is saved. At most once.
- To Google Gemini or OpenAI, depending on the provider you saved. At most once.

That snapshot includes the selected element’s tag, id, class, role, size, counts, a short text sample, a few style properties, and a shallow child tree. It does not include the screenshot, the full page HTML, or your API key inside the prompt.

Those providers process the request under their own terms. Pixel2Prompt does not receive a copy of the provider response except the text shown in the panel.

## Not collected

- Account identity
- Usage analytics
- A copy of your keys in this repository
- Page content from people who only hover or select

Questions: [mail.buildsbyRD@gmail.com](mailto:mail.buildsbyRD@gmail.com).
