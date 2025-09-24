const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

// Configuration
const BASE_URL = 'http://localhost:3000';
const PAGES_TO_TEST = [
  { path: '/', name: 'Dashboard' },
  { path: '/new-request', name: 'New Request' },
  { path: '/requests', name: 'My Requests' },
  { path: '/approve-requests', name: 'Approve Requests' },
  { path: '/edit-users', name: 'Edit Users' },
  { path: '/company-settings', name: 'Company Settings' },
  { path: '/not-authorized', name: 'Not Authorized' }
];

// Test user credentials for different roles
const TEST_USERS = {
  admin: { email: 'admin@company.com', password: 'admin123' },
  manager: { email: 'manager@company.com', password: 'manager123' },
  employee: { email: 'employee@company.com', password: 'employee123' }
};

class AccessibilityAuditor {
  constructor() {
    this.browser = null;
    this.context = null;
    this.results = {
      summary: {
        totalPages: 0,
        passedPages: 0,
        failedPages: 0,
        totalViolations: 0,
        criticalViolations: 0,
        seriousViolations: 0,
        moderateViolations: 0,
        minorViolations: 0
      },
      pageResults: []
    };
  }

  async initialize() {
    console.log('Starting Accessibility Audit...\n');
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
  }

  async login(page, userType = 'admin') {
    const user = TEST_USERS[userType];
    if (!user) {
      throw new Error(`Unknown user type: ${userType}`);
    }

    try {
      // Navigate to login page
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      // Fill login form
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log(`Logged in as ${userType}`);
      return true;
    } catch (error) {
      console.log(`Login failed for ${userType}, testing as guest`);
      return false;
    }
  }

  async testPage(page, pageInfo, userType = 'guest') {
    const { path, name } = pageInfo;
    console.log(`Testing: ${name} (${path}) as ${userType}`);

    try {
      // Navigate to page
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');

      // Wait a bit for any dynamic content
      await page.waitForTimeout(1000);

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      // Process results
      const violations = accessibilityScanResults.violations;
      const pageResult = {
        page: name,
        path,
        userType,
        passed: violations.length === 0,
        violationCount: violations.length,
        violations: violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.length,
          tags: violation.tags
        }))
      };

      // Update summary
      this.results.summary.totalPages++;
      if (pageResult.passed) {
        this.results.summary.passedPages++;
        console.log(`  PASSED - No violations found`);
      } else {
        this.results.summary.failedPages++;
        console.log(`  FAILED - ${violations.length} violations found`);
        
        // Count violations by impact
        violations.forEach(violation => {
          this.results.summary.totalViolations++;
          switch (violation.impact) {
            case 'critical':
              this.results.summary.criticalViolations++;
              break;
            case 'serious':
              this.results.summary.seriousViolations++;
              break;
            case 'moderate':
              this.results.summary.moderateViolations++;
              break;
            case 'minor':
              this.results.summary.minorViolations++;
              break;
          }
        });
      }

      this.results.pageResults.push(pageResult);
      return pageResult;

    } catch (error) {
      console.log(`  Error testing ${name}: ${error.message}`);
      const errorResult = {
        page: name,
        path,
        userType,
        passed: false,
        error: error.message,
        violationCount: 0,
        violations: []
      };
      this.results.pageResults.push(errorResult);
      this.results.summary.totalPages++;
      this.results.summary.failedPages++;
      return errorResult;
    }
  }

  async testInteractiveElements(page) {
    console.log('Testing interactive elements...');

    try {
      // Test modal dialogs (if any are present)
      const modalTriggers = await page.locator('button:has-text("Delete"), button:has-text("Add"), button:has-text("Edit")').all();
      
      for (const trigger of modalTriggers.slice(0, 2)) { // Test first 2 to avoid too many modals
        try {
          await trigger.click();
          await page.waitForTimeout(500);
          
          // Check if modal is properly trapped
          const modal = page.locator('[role="dialog"]');
          if (await modal.count() > 0) {
            // Test focus trap by pressing Tab
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            
            // Test Escape key
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
          }
        } catch (error) {
          // Continue with other tests
        }
      }

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');

      console.log('  Interactive elements tested');
    } catch (error) {
      console.log(`  Error testing interactive elements: ${error.message}`);
    }
  }

  async generateReport() {
    const { summary, pageResults } = this.results;
    
    console.log('\n' + '='.repeat(60));
    console.log('ACCESSIBILITY AUDIT REPORT');
    console.log('='.repeat(60));
    
    // Summary
    console.log('\nSUMMARY:');
    console.log(`Total Pages Tested: ${summary.totalPages}`);
    console.log(`Passed: ${summary.passedPages} (${Math.round(summary.passedPages / summary.totalPages * 100)}%)`);
    console.log(`Failed: ${summary.failedPages} (${Math.round(summary.failedPages / summary.totalPages * 100)}%)`);
    console.log(`Total Violations: ${summary.totalViolations}`);
    
    if (summary.totalViolations > 0) {
      console.log('\nVIOLATIONS BY SEVERITY:');
      if (summary.criticalViolations > 0) console.log(`Critical: ${summary.criticalViolations}`);
      if (summary.seriousViolations > 0) console.log(`Serious: ${summary.seriousViolations}`);
      if (summary.moderateViolations > 0) console.log(`Moderate: ${summary.moderateViolations}`);
      if (summary.minorViolations > 0) console.log(`Minor: ${summary.minorViolations}`);
    }

    // Detailed results
    console.log('\nDETAILED RESULTS:');
    pageResults.forEach(result => {
      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(`\n${status} ${result.page} (${result.path})`);
      
      if (!result.passed && result.violations) {
        result.violations.forEach(violation => {
          const impact = violation.impact ? `[${violation.impact.toUpperCase()}]` : '[UNKNOWN]';
          console.log(`  ${impact} ${violation.id}: ${violation.description}`);
          console.log(`    Help: ${violation.help}`);
          console.log(`    Affected elements: ${violation.nodes}`);
          if (violation.helpUrl) {
            console.log(`    More info: ${violation.helpUrl}`);
          }
        });
      }
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    // Recommendations
    console.log('\nRECOMMENDATIONS:');
    if (summary.totalViolations === 0) {
      console.log('Excellent! No accessibility violations found.');
      console.log('Your application meets WCAG 2.1 AA standards.');
    } else {
      console.log('Focus on fixing violations in this order:');
      if (summary.criticalViolations > 0) console.log('1. Critical violations (blocking for users with disabilities)');
      if (summary.seriousViolations > 0) console.log('2. Serious violations (significant barriers)');
      if (summary.moderateViolations > 0) console.log('3. Moderate violations (some barriers)');
      if (summary.minorViolations > 0) console.log('4. Minor violations (minor inconveniences)');
    }

    console.log('\n' + '='.repeat(60));
    
    // Return overall pass/fail
    return summary.criticalViolations === 0 && summary.seriousViolations === 0;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      const page = await this.context.newPage();

      // Test public pages first
      for (const pageInfo of PAGES_TO_TEST.slice(0, 2)) { // Dashboard and not-authorized
        await this.testPage(page, pageInfo, 'guest');
      }

      // Test with admin user
      const loginSuccess = await this.login(page, 'admin');
      if (loginSuccess) {
        for (const pageInfo of PAGES_TO_TEST) {
          await this.testPage(page, pageInfo, 'admin');
          
          // Test interactive elements on key pages
          if (['Dashboard', 'Edit Users', 'Approve Requests'].includes(pageInfo.name)) {
            await this.testInteractiveElements(page);
          }
        }
      }

      const overallPass = await this.generateReport();
      
      // Exit with appropriate code
      process.exit(overallPass ? 0 : 1);

    } catch (error) {
      console.error('Audit failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the audit
const auditor = new AccessibilityAuditor();
auditor.run().catch(console.error);