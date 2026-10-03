import type { SnipBox } from "./snip.ts"

const HOST_ID = "pixel2prompt-highlight"

export type SnipOverlay = {
  host: HTMLElement
  showBox(box: SnipBox): void
  hideBox(): void
  remove(): void
}

export function mountSnipOverlay(): SnipOverlay {
  document.getElementById(HOST_ID)?.remove()

  const host = document.createElement("div")
  host.id = HOST_ID
  host.setAttribute("data-pixel2prompt-highlight", "")
  const shadow = host.attachShadow({ mode: "open" })
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        cursor: crosshair;
      }
      .shade,
      .catcher {
        position: fixed;
        inset: 0;
      }
      .shade {
        background: rgba(8, 10, 22, 0.35);
      }
      .shade.hidden {
        display: none;
      }
      .box {
        position: fixed;
        display: none;
        box-sizing: border-box;
        border: 2px solid #3ecbff;
        background: transparent;
        box-shadow: 0 0 0 100vmax rgba(8, 10, 22, 0.5);
      }
      .box.on {
        display: block;
      }
      .label,
      .hint {
        position: fixed;
        padding: 4px 8px;
        border-radius: 6px;
        background: #3ecbff;
        color: #071018;
        font: 600 12px/1.3 "Segoe UI", ui-sans-serif, system-ui, sans-serif;
        white-space: nowrap;
      }
      .hint {
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
      }
      .label {
        display: none;
      }
    </style>
    <div class="shade"></div>
    <div class="catcher"></div>
    <div class="box"></div>
    <div class="label"></div>
    <div class="hint">Drag to select · Esc cancels</div>
  `

  const shade = shadow.querySelector(".shade")
  const box = shadow.querySelector(".box")
  const label = shadow.querySelector(".label")
  if (!(shade instanceof HTMLElement) || !(box instanceof HTMLElement) || !(label instanceof HTMLElement)) {
    throw new Error("Snip overlay failed to mount.")
  }

  document.documentElement.append(host)

  return {
    host,
    showBox(next) {
      shade.classList.add("hidden")
      box.classList.add("on")
      box.style.left = `${next.x}px`
      box.style.top = `${next.y}px`
      box.style.width = `${next.width}px`
      box.style.height = `${next.height}px`
      label.style.display = "block"
      label.textContent = `${next.width} × ${next.height}`
      label.dataset.label = label.textContent
      const top = next.y > 28 ? next.y - 26 : next.y + next.height + 8
      label.style.left = `${Math.max(8, next.x)}px`
      label.style.top = `${top}px`
    },
    hideBox() {
      shade.classList.remove("hidden")
      box.classList.remove("on")
      label.style.display = "none"
    },
    remove() {
      host.remove()
    },
  }
}
