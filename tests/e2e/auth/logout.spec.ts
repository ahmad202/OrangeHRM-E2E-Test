import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { CREDENTIALS, ROUTES } from '../../utils/test-data';

/**
 * Logout is destructive to the *server-side* session, so these specs must own
 * the session they end.
 *
 * Playwright gives every test its own browser context, but a stored
 * `storageState` is only a cookie — all tests sharing it point at one session on
 * the server. Calling logout from a test that reused `auth.setup.ts`'s state
 * invalidates that session for every test still running, which shows up as
 * unrelated specs being bounced to the login page.
 *
 * These tests therefore import the plain `@playwright/test` runner (no stored
 * state) and log in through the UI first, so the session they destroy is
 * their own.
 */
test.describe('Logout', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(CREDENTIALS.admin.username, CREDENTIALS.admin.password);

    dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
  });

  test('returns to the login page @smoke', async ({ page }) => {
    await dashboardPage.topBar.logout();

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('invalidates the session so protected routes are blocked', async ({ page }) => {
    await dashboardPage.topBar.logout();
    await expect(page).toHaveURL(/\/auth\/login$/);

    await page.goto(ROUTES.employeeList);

    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});
