# Security

Pixel2Prompt does not ship with API keys. Do not commit `.env` files, Chrome profiles, or captured page content.

Hovering and selecting a section stay on the device. Webpage content is sent only after you click Generate Prompt, and only the compact section snapshot goes to the Jev and LLM providers configured with your own keys.

Keys are stored in Chrome local storage. They are not written to the page, the repository, or console logs.

Report a security issue to mail.buildsbyRD@gmail.com.
