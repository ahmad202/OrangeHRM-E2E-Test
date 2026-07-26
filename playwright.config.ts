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

const DEFAULT_INSTANCE = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';

/**
 * Resolves the target instance to an origin.
 *
 * Accepts any URL belonging to the instance, not just its origin — a login URL
 * copied straight out of the browser bar, a trailing slash, or a bare origin all
 * normalise to the same thing. Every route in this suite is an absolute path, so
 * only the origin is ever used.
 *
 * An unparseable value is a hard error rather than a silent fallback: quietly
 * testing the public demo when you meant your own instance is worse than failing.
 */
function resolveBaseURL(raw: string | undefined): string {
  const value = raw?.trim() || DEFAULT_INSTANCE;
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(
      `BASE_URL is not a valid URL: "${value}". Include the scheme, e.g. https://hr.example.com`,
    );
  }
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
    baseURL: resolveBaseURL(process.env.BASE_URL),
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
