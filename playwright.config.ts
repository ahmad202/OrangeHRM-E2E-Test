import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

/**
 * HTML and JSON always; CI additionally emits JUnit (for any test-reporting
 * integration) and GitHub annotations (failures shown inline on the run).
 */
const reporters: ReporterDescription[] = [
  ['html', { open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
];

if (process.env.CI) {
  reporters.push(['junit', { outputFile: 'test-results/junit.xml' }], ['github']);
} else {
  reporters.push(['list']);
}

/**
 * The system under test is the public OrangeHRM open-source demo. It is a shared,
 * internet-facing sandbox, which drives three config decisions:
 *
 *  - No `webServer` block. There is nothing to boot locally.
 *  - Conservative worker counts. Hammering a shared public host causes both flake
 *    and rudeness; parallelism is capped rather than left to the CPU count.
 *  - Generous navigation timeouts. The demo is frequently slow under load.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: reporters,
  use: {
    baseURL: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    // Mobile projects are deliberately omitted. OrangeHRM collapses the side panel
    // behind a toggle below ~1024px, so the navigation specs assume a desktop
    // layout and would fail there for layout reasons rather than real defects.
    // Add mobile projects only alongside mobile-aware navigation helpers.
  ],
});
