# Architecture

Pixel2Prompt is a Manifest V3 extension. The page, the side panel, and the service worker share messages. There is no server in this repository.

See [diagrams/architecture.mmd](../diagrams/architecture.mmd), [diagrams/user-flow.mmd](../diagrams/user-flow.mmd), and [diagrams/sequence.mmd](../diagrams/sequence.mmd).

## Parts

| Part | Path | Role |
| --- | --- | --- |
| Side panel | `src/sidepanel/` | React UI, crop, settings, and Generate prompt |
| Service worker | `src/background/service-worker.ts` | Opens the panel on the toolbar click, injects the content script, captures the visible tab |
| Content script | `src/content/` | Snipping-tool drag selection. Injected on demand, not for every site |
| Analyzer | `src/analyzer/` | Compact `SectionSnapshot` and the visible crop rectangle |
| AI | `src/ai/` | Optional Jev call, then one LLM call |
| Storage | `src/storage/settings.ts` | Jev key, provider, and LLM key in `chrome.storage.local` |

## Selection

Select section covers the page with a snipping overlay. Drag a rectangle and release. Esc cancels. A drag smaller than 12 pixels is ignored. The overlay is removed before the screenshot, so it is not in the PNG.

The crop is that rectangle. The snapshot comes from the element at the center of the rectangle, with the snip’s width and height. The service worker captures the visible tab, and the panel crops it to the rectangle.

Parent and Smaller ask the content script to move the selection, then capture again. Lock section only disables those controls in the panel.

## Snapshot

`SectionSnapshot` keeps the tag, id, class, role, size, element and image counts, a short text sample, a few computed style properties, and a shallow child tree. Depth, child count, text length, and element count are capped. This object is what Generate prompt may send. The PNG stays out of that payload.

## Generate prompt

`generateReconstructionPrompt` enforces the request budget:

1. If the LLM key is missing, it throws before any fetch.
2. If the Jev key is present, it makes one `POST` to `https://api.typesafe.ai/v1/systemone` with model `jev-latest`. Jev classifies the section. It does not write the long prompt.
3. If that call fails, the LLM is not called.
4. One LLM request writes the prompt. Gemini uses `gemini-3.5-flash-lite` and the `x-goog-api-key` header. If that model is unavailable, one follow-up uses the replacement model named by the API. OpenAI uses `gpt-4o-mini` and a bearer token. Temperature is `0.2`.

A single-flight lock ignores a second Generate click while the first run is in progress. Changing the stack clears the prompt and does not call the network until you generate again.

## Permissions

`sidePanel`, `activeTab`, `scripting`, and `storage`. Host access is limited to the TypeSafe, Gemini, and OpenAI origins used above. There is no `<all_urls>` permission and no `downloads` permission. PNG and markdown files are saved with a link click.

## Limitations

- Restricted pages (`chrome://`, the Web Store, other extension pages) are refused.
- Missing `tab.url` is not treated as restricted, because the extension does not have the `tabs` permission. Injection is attempted, and a permission error tells you to click the toolbar icon.
- Cross-origin iframes are out of scope.
- A section taller than the viewport is marked as clipped.
- `captureVisibleTab` needs the toolbar gesture that grants `activeTab`.
