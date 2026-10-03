# Security

Pixel2Prompt does not ship with API keys. Do not commit `.env` files, Chrome profiles, or captured page content.

This build does not send webpage content to any server. The content script only answers a local ping from the side panel after you click Select Section.

Later AI calls will use keys you save in Chrome's local extension storage, and only after you explicitly generate a prompt.

Report a security issue to mail.buildsbyRD@gmail.com.
