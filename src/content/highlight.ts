const HOST_ID = "pixel2prompt-highlight"

export type Highlight = {
  show(rect: DOMRect, label: string): void
  hide(): void
}

export function mountHighlight(): Highlight {
  const existing = document.getElementById(HOST_ID)
  existing?.remove()

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
        pointer-events: none;
      }
      .box {
        position: fixed;
        border: 2px solid #d6ff4a;
        border-radius: 6px;
        background: rgba(214, 255, 74, 0.12);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.45);
      }
      .label {
        position: fixed;
        max-width: 240px;
        padding: 3px 6px;
        border-radius: 4px;
        background: #d6ff4a;
        color: #152000;
        font: 600 11px/1.3 "Segoe UI", ui-sans-serif, system-ui, sans-serif;
        white-space: nowrap;
      }
    </style>
    <div class="box"></div>
    <div class="label"></div>
  `

  const box = shadow.querySelector(".box")
  const label = shadow.querySelector(".label")
  if (!(box instanceof HTMLElement) || !(label instanceof HTMLElement)) {
    throw new Error("Highlight overlay failed to mount.")
  }

  document.documentElement.append(host)

  return {
    show(rect, text) {
      box.style.left = `${rect.left}px`
      box.style.top = `${rect.top}px`
      box.style.width = `${rect.width}px`
      box.style.height = `${rect.height}px`
      label.textContent = text
      label.dataset.label = text
      const top = rect.top > 28 ? rect.top - 22 : rect.top + 6
      label.style.left = `${Math.max(8, rect.left)}px`
      label.style.top = `${top}px`
    },
    hide() {
      host.remove()
    },
  }
}
