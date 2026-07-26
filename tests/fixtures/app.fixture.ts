import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { EmployeeListPage } from '../pages/employee-list.page';
import { EmployeeRecordPage } from '../pages/employee-record.page';
import { SystemUsersPage } from '../pages/system-users.page';
import { CandidatesPage } from '../pages/candidates.page';
import { DirectoryPage } from '../pages/directory.page';
import { AUTH_FILE } from '../utils/test-data';

type AppFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeListPage: EmployeeListPage;
  employeeRecordPage: EmployeeRecordPage;
  systemUsersPage: SystemUsersPage;
  candidatesPage: CandidatesPage;
  directoryPage: DirectoryPage;
};

/**
 * Fixtures for specs that need an authenticated session.
 *
 * The stored state from `auth.setup.ts` is applied at the context level, so each
 * test still gets its own isolated browser context — only the login round-trip
 * is shared, never live page state.
 *
 * Fixtures that navigate do so during setup; a spec that needs to start
 * somewhere else should construct the page object itself.
 */
export const test = base.extend<AppFixtures>({
  storageState: AUTH_FILE,

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await use(dashboardPage);
  },

  employeeListPage: async ({ page }, use) => {
    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();
    await use(employeeListPage);
  },

  // Not navigated: journeys reach a record by drilling in from a list, and
  // self-service journeys start from My Info.
  employeeRecordPage: async ({ page }, use) => {
    await use(new EmployeeRecordPage(page));
  },

  systemUsersPage: async ({ page }, use) => {
    const systemUsersPage = new SystemUsersPage(page);
    await systemUsersPage.goto();
    await use(systemUsersPage);
  },

  candidatesPage: async ({ page }, use) => {
    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();
    await use(candidatesPage);
  },

  directoryPage: async ({ page }, use) => {
    const directoryPage = new DirectoryPage(page);
    await directoryPage.goto();
    await use(directoryPage);
  },
});

export { expect } from '@playwright/test';
