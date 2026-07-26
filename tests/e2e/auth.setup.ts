import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { AUTH_FILE, CREDENTIALS, ROUTES } from '../utils/test-data';

/**
 * Logs in once and stores the session so the authenticated specs skip the login
 * form. Runs as its own project that every browser project depends on.
 *
 * This must start from a clean context and navigate straight to the login page.
 * OrangeHRM remembers the last protected URL a session was bounced from and
 * redirects there after login instead of the dashboard, so a polluted context
 * would break the assertion below.
 */
setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(CREDENTIALS.admin.username, CREDENTIALS.admin.password);

  await expect(page).toHaveURL(new RegExp(`${ROUTES.dashboard}$`));

  // Language canary. Every locator in this suite matches English UI text, and on
  // the shared demo anyone can change the instance's localisation — it flipped to
  // Dutch mid-run during development. Asserting it once here turns that into a
  // single legible failure instead of dozens of opaque locator timeouts.
  await expect(
    page.getByRole('banner').getByRole('heading', { level: 6 }).first(),
    'Instance is not in English. This suite matches English UI text — check Admin > Configuration > Localization.',
  ).toHaveText('Dashboard');

  await page.context().storageState({ path: AUTH_FILE });
});
