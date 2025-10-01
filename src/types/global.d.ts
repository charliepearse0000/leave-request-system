declare global {
  // Helpers exposed in jest.setup
  const runAxe: (container: HTMLElement) => Promise<any>
  const formatViolations: (violations: any) => string
}

export {}