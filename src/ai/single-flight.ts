export function createSingleFlight(): <T>(task: () => Promise<T>) => Promise<T | undefined> {
  let running = false
  return async function run<T>(task: () => Promise<T>): Promise<T | undefined> {
    if (running) return undefined
    running = true
    try {
      return await task()
    } finally {
      running = false
    }
  }
}
