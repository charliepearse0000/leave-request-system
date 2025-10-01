import axeCore from 'axe-core'

export async function runAxe(container: HTMLElement) {
  const results = await axeCore.run(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa'],
    },
    rules: {
      'color-contrast': { enabled: false },
    },
  })
  return results.violations
}

export function formatViolations(violations: axeCore.Result['violations']) {
  return violations
    .map(v => {
      const nodes = v.nodes
        .map(n => `- ${n.html} | target: ${n.target.join(' ')} | impact: ${n.impact}`)
        .join('\n')
      return `${v.id}: ${v.help} (${v.impact})\n${nodes}`
    })
    .join('\n\n')
}