import { defineManifest } from "@crxjs/vite-plugin"

export default defineManifest({
  manifest_version: 3,
  name: "Pixel2Prompt",
  version: "0.1.0",
  description:
    "Capture a website section and turn it into a reconstruction prompt.",
  minimum_chrome_version: "116",
  action: {
    default_title: "Pixel2Prompt",
    default_icon: {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    },
  },
  icons: {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  permissions: ["sidePanel", "activeTab", "scripting", "storage"],
  host_permissions: [
    "https://api.typesafe.ai/*",
    "https://generativelanguage.googleapis.com/*",
    "https://api.openai.com/*",
  ],
})
