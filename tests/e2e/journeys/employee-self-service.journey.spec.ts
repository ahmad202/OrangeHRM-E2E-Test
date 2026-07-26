import { test, expect } from '../../fixtures/app.fixture';
import { EMPLOYEE_RECORD_TABS, EmployeeRecordTab } from '../../utils/test-data';

/**
 * Journey: employee self-service.
 *
 * Business process — a signed-in employee reviews their own file through My
 * Info. Same screen as the HR audit, reached a different way and scoped to
 * exactly one employee: their own.
 *
 * Read-only: nothing is created or edited.
 */
test.describe('Journey: employee self-service', () => {
  test('opens My Info and reviews every section of the personal file @journey', async ({
    employeeRecordPage,
  }) => {
    // Ten tabs, ten full page loads — see the note in hr-record-audit.
    test.slow();

    // Step 1 — the employee opens My Info. The route resolves to their own
    // employee number rather than a generic page.
    await employeeRecordPage.gotoMyInfo();
    const ownNumber = employeeRecordPage.employeeNumber();

    await employeeRecordPage.expectTabsVisible();

    // Step 2 — every section stays scoped to the signed-in employee. Self-service
    // leaking another employee's data would be a privacy defect.
    for (const tab of Object.keys(EMPLOYEE_RECORD_TABS) as EmployeeRecordTab[]) {
      await employeeRecordPage.openTab(tab);
      expect(employeeRecordPage.employeeNumber(), `"${tab}" should stay on the signed-in employee`).toBe(
        ownNumber,
      );
    }
  });

  test('reaches My Info from the side menu @journey', async ({ dashboardPage, employeeRecordPage, page }) => {
    await dashboardPage.sideMenu.openModule('My Info');

    await expect(page).toHaveURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+$/);
    await employeeRecordPage.expectTabsVisible();
    // My Info lives inside PIM, so the banner shows the PIM module.
    await dashboardPage.topBar.expectModuleTitle('PIM');
  });
});
