export const STACKS = [
  { id: "existing", label: "Follow the existing project stack" },
  { id: "react", label: "React" },
  { id: "next", label: "Next.js" },
  { id: "html", label: "HTML/CSS" },
  { id: "tailwind", label: "Tailwind" },
  { id: "flutter", label: "Flutter" },
  { id: "android", label: "Android" },
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
    case "flutter":
      return "Build it as a Flutter widget in Dart. It should run on Android and iOS."
    case "android":
      return "Build it as a native Android screen in Kotlin with Jetpack Compose."
    case "existing":
      return "Follow the existing project stack. Do not introduce a new framework."
  }
}
