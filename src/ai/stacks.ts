export const STACKS = [
  { id: "existing", label: "Existing project stack" },
  { id: "react", label: "React" },
  { id: "next", label: "Next.js" },
  { id: "html", label: "HTML/CSS" },
  { id: "tailwind", label: "Tailwind" },
] as const

export type StackId = (typeof STACKS)[number]["id"]

export function stackInstruction(stack: StackId): string {
  switch (stack) {
    case "react":
      return "Build it as a React component."
    case "next":
      return "Build it as a Next.js component."
    case "html":
      return "Build it with HTML and CSS only."
    case "tailwind":
      return "Build it with HTML and Tailwind utility classes."
    case "existing":
      return "Follow the existing project stack. Do not introduce a new framework."
  }
}
