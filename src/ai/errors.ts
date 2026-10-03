export class PromptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PromptError"
  }
}

export function redactKey(message: string, key: string): string {
  const trimmed = key.trim()
  if (!trimmed) return message
  return message.split(trimmed).join("[key]")
}

export async function readFailure(response: Response, key: string): Promise<string> {
  const body = redactKey(await response.text(), key).slice(0, 500)
  if (response.status === 401 || response.status === 403 || /api[_ ]?key|unauthorized|permission denied/i.test(body)) {
    return "invalid-key"
  }
  return `status ${response.status}`
}
