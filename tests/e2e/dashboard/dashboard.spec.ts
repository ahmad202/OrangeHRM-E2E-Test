import { test, expect } from '../../fixtures/app.fixture';
import { DASHBOARD_WIDGETS, SIDE_MENU_ITEMS } from '../../utils/test-data';

test.describe('Dashboard', () => {
  test('renders every dashboard widget @smoke', async ({ dashboardPage }) => {
    for (const title of DASHBOARD_WIDGETS) {
      await expect.soft(dashboardPage.widget(title), `widget "${title}" should render`).toBeVisible();
    }
  });

  test('offers the quick launch shortcuts', async ({ dashboardPage }) => {
    const shortcuts = ['Assign Leave', 'Leave List', 'Timesheets', 'Apply Leave', 'My Leave', 'My Timesheet'];

    for (const shortcut of shortcuts) {
      await expect.soft(dashboardPage.quickLaunch(shortcut)).toBeVisible();
    }
  });
});

test.describe('Module navigation', () => {
  test('lists every module in the side panel', async ({ dashboardPage }) => {
    await dashboardPage.sideMenu.expectVisible();

    const names = await dashboardPage.sideMenu.visibleModuleNames();
    expect(names).toEqual(SIDE_MENU_ITEMS.map((item) => item.name));
  });

  test('filters the module list from the side panel search', async ({ dashboardPage }) => {
    await dashboardPage.sideMenu.filterModules('Leave');

    await expect(dashboardPage.sideMenu.module('Leave')).toBeVisible();
    await expect(dashboardPage.sideMenu.module('Recruitment')).toBeHidden();
  });

  // Each module is checked independently so one broken module does not mask the rest.
  // The assertion targets the page the module *redirects to*, not its menu href:
  // every `viewXModule` URL bounces to that module's default screen.
  for (const item of SIDE_MENU_ITEMS.filter((m) => !('reauth' in m))) {
    test(`opens the ${item.name} module`, async ({ dashboardPage, page }) => {
      await dashboardPage.sideMenu.openModule(item.name);

      await expect(page).toHaveURL(item.landing);
      await expect(dashboardPage.topBar.moduleTitle).toHaveText(item.title);
    });
  }

  test('challenges for credentials before opening Maintenance', async ({ dashboardPage, page }) => {
    await dashboardPage.sideMenu.openModule('Maintenance');

    await expect(page).toHaveURL(/\/maintenance\/purgeEmployee$/);
    await expect(page.getByRole('heading', { name: 'Administrator Access' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible();
    // The password is deliberately not confirmed: past this gate is OrangeHRM's
    // employee purge screen, which must not be exercised on a shared demo.
  });
});
