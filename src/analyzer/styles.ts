const KEPT = [
  "display",
  "position",
  "flex-direction",
  "justify-content",
  "align-items",
  "gap",
  "row-gap",
  "column-gap",
  "padding",
  "margin",
  "color",
  "background-color",
  "border",
  "border-radius",
  "box-shadow",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "text-align",
] as const

export function readUsefulStyle(style: CSSStyleDeclaration): Record<string, string> {
  const result: Record<string, string> = {}
  for (const property of KEPT) {
    const value = style.getPropertyValue(property).trim()
    if (!value || isDefault(property, value)) continue
    result[property] = property === "font-family" ? value.slice(0, 80) : value
  }
  return result
}

function isDefault(property: string, value: string): boolean {
  switch (property) {
    case "display":
      return value === "block" || value === "inline"
    case "position":
      return value === "static"
    case "flex-direction":
      return value === "row"
    case "justify-content":
      return value === "normal" || value === "flex-start"
    case "align-items":
      return value === "normal" || value === "stretch"
    case "gap":
    case "row-gap":
    case "column-gap":
    case "padding":
    case "margin":
    case "border-radius":
      return value === "0px" || value === "normal" || isZeroBox(value)
    case "background-color":
      return value === "rgba(0, 0, 0, 0)" || value === "transparent"
    case "border":
      return value.startsWith("0px") || value === "none"
    case "box-shadow":
      return value === "none"
    case "font-weight":
      return value === "400" || value === "normal"
    case "text-align":
      return value === "start"
    case "line-height":
      return value === "normal"
    default:
      return false
  }
}

function isZeroBox(value: string): boolean {
  return value.split(" ").every((part) => part === "0px")
}
