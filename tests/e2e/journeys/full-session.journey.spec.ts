import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { EmployeeListPage } from '../../pages/employee-list.page';
import { SystemUsersPage } from '../../pages/system-users.page';
import { CandidatesPage } from '../../pages/candidates.page';
import { CREDENTIALS } from '../../utils/test-data';

/**
 * Journey: a full working session, sign-in to sign-out.
 *
 * Business process — one continuous session in which an HR administrator signs
 * in, checks the dashboard, moves between the modules they use during a normal
 * day, and signs out cleanly. The individual screens are covered elsewhere; what
 * this journey proves is that they compose — that context, navigation and the
 * session survive being used in sequence rather than in isolation.
 *
 * This spec owns its session: it logs in through the UI and ends with a logout,
 * which destroys the session server-side. Running it against the shared
 * `storageState` would sign every concurrent test out. See `logout.spec.ts`.
 *
 * Read-only apart from the sign-in and sign-out themselves.
 */
test.describe('Journey: full working session', () => {
  test('signs in, works across modules and signs out @journey @smoke', async ({ page }) => {
    // Step 1 — sign in.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(CREDENTIALS.admin.username, CREDENTIALS.admin.password);

    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();

    // Step 2 — glance at the dashboard for outstanding actions.
    await expect(dashboard.widget('My Actions')).toBeVisible();
    await expect(dashboard.widget('Quick Launch')).toBeVisible();

    // Step 3 — review the workforce in PIM.
    await dashboard.sideMenu.openModule('PIM');
    const employees = new EmployeeListPage(page);
    await employees.waitForReady();
    await employees.expectSomeRecords();

    // Step 4 — check the hiring pipeline.
    await dashboard.sideMenu.openModule('Recruitment');
    const candidates = new CandidatesPage(page);
    await candidates.waitForReady();
    await candidates.expectSomeRecords();

    // Step 5 — check who has system access.
    await dashboard.sideMenu.openModule('Admin');
    const users = new SystemUsersPage(page);
    await users.waitForReady();
    await users.expectSomeRecords();

    // Step 6 — back to the dashboard; the session has held throughout.
    await dashboard.sideMenu.openModule('Dashboard');
    await dashboard.expectLoaded();

    // Step 7 — sign out, and confirm the session is genuinely over.
    await dashboard.topBar.logout();
    await expect(page).toHaveURL(/\/auth\/login$/);

    await page.goto('/web/index.php/pim/viewEmployeeList');
    await expect(page, 'a signed-out session must not reach PIM').toHaveURL(/\/auth\/login$/);
  });
});
