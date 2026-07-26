import { test, expect } from '../../fixtures/app.fixture';

/**
 * Non-destructive checks against the shared admin session.
 *
 * Anything that ends the session lives in `logout.spec.ts` and logs in for
 * itself — see the note there.
 */
test.describe('Session', () => {
  test('reuses the stored session without hitting the login form @smoke', async ({ dashboardPage }) => {
    await dashboardPage.expectLoaded();
  });

  // These entries are anchors with an explicit role="menuitem", so they are
  // matched as menu items rather than links.
  test('exposes account actions in the user menu', async ({ dashboardPage }) => {
    await dashboardPage.topBar.openUserMenu();

    await expect(dashboardPage.topBar.aboutLink).toBeVisible();
    await expect(dashboardPage.topBar.changePasswordLink).toBeVisible();
    await expect(dashboardPage.topBar.logoutLink).toBeVisible();
  });
});
