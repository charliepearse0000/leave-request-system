// Playwright + axe-core accessibility audit runner
// Audits a given path on the Next.js app, filters serious/critical issues, and exits with nonzero on violations.

const { spawn } = require('child_process')
const http = require('http')
const { chromium } = require('playwright')
const AxeBuilder = require('@axe-core/playwright').default

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001
const BASE_URL = `http://localhost:${PORT}`
const PATH = process.env.A11Y_PATH || '/'
const TIMEOUT_MS = process.env.A11Y_TIMEOUT ? Number(process.env.A11Y_TIMEOUT) : 30000

function waitForServerReady(url, timeoutMs = 20000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    function check() {
      http.get(url, res => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true)
        } else {
          retry()
        }
      }).on('error', retry)

      function retry() {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Server did not become ready in time'))
        } else {
          setTimeout(check, 500)
        }
      }
    }
    check()
  })
}

async function run() {
  // Start Next dev server on PORT
  const devEnv = { ...process.env, PORT: String(PORT) }
  // Spawn Next directly via Node to avoid Windows spawn issues with npx
  const nextBin = require.resolve('next/dist/bin/next')
  const dev = spawn(process.execPath, [nextBin, 'dev', '-p', String(PORT)], {
    env: devEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let serverLogs = ''
  dev.stdout.on('data', d => { serverLogs += d.toString() })
  dev.stderr.on('data', d => { serverLogs += d.toString() })

  try {
    await waitForServerReady(BASE_URL)
  } catch (e) {
    console.error('Failed to start dev server:', e.message)
    console.error(serverLogs)
    dev.kill('SIGINT')
    process.exit(1)
  }

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Intercept API calls to localhost:3000 and stub minimal responses
  await page.route('**/api/**', async route => {
    const url = route.request().url()
    if (url.includes('/api/leave-requests/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ annualLeaveBalance: 10, sickLeaveBalance: 5 })
      })
      return
    }
    // Default stub
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  })

  const deadline = Date.now() + TIMEOUT_MS
  try {
    // First navigate to set localStorage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('authToken', 'token')
      localStorage.setItem('userData', JSON.stringify({ id: 'u1', role: { id: 'r1', name: 'employee' }, email: 'john.doe@company.com' }))
    })
    // Navigate to target page
    await page.goto(BASE_URL + PATH, { waitUntil: 'domcontentloaded' })

    // Ensure main exists
    await page.waitForSelector('main', { timeout: Math.max(2000, TIMEOUT_MS / 3) })

    // Run axe on main only, wcag2a + wcag2aa, disable color-contrast
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .include('main')
      .analyze()

    const serious = (results.violations || []).filter(v => v.impact === 'serious' || v.impact === 'critical')
    if (serious.length) {
      console.error('Accessibility violations (serious/critical):')
      for (const v of serious) {
        console.error(`${v.id}: ${v.help} (${v.impact})`)
        for (const n of v.nodes) {
          console.error(`- ${n.html} | target: ${n.target.join(' ')} | impact: ${n.impact}`)
        }
        console.error('')
      }
      throw new Error(`Found ${serious.length} serious/critical violations`)
    }

    console.log('✅ No serious/critical accessibility violations found on', PATH)
  } catch (err) {
    console.error('Axe audit error:', err && err.message ? err.message : err)
    process.exitCode = 1
  } finally {
    try { await page.close() } catch {}
    try { await context.close() } catch {}
    try { await browser.close() } catch {}
    dev.kill('SIGINT')
    // Hard stop if we exceed timeout
    if (Date.now() > deadline) {
      console.error('Audit timed out beyond', TIMEOUT_MS, 'ms; forcing exit.')
      process.exitCode = 1
    }
  }
}

run()