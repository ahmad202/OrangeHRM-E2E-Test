import { test, expect } from '../../fixtures/app.fixture';
import { EmployeeColumn } from '../../pages/employee-list.page';
import { EmployeeRecordPage } from '../../pages/employee-record.page';
import { EMPLOYEE_RECORD_TABS, EmployeeRecordTab } from '../../utils/test-data';

/**
 * Journey: HR administrator audits an employee record.
 *
 * Business process — an HR admin needs to review a specific employee's file:
 * find them in PIM, open their record, and move through the sections that make
 * up the file (personal, job, salary, reporting line) without losing context.
 *
 * Read-only: nothing is created or edited.
 */
test.describe('Journey: HR record audit', () => {
  test('finds an employee, opens their record and reviews every section @journey', async ({
    employeeListPage,
    page,
  }) => {
    // Each record tab is a real `<a href>`, so walking all ten reboots the Vue
    // application ten times. That does not fit the default 60s budget when the
    // shared demo is under load — this is genuine length, not a race, so the
    // budget is tripled rather than the assertions loosened.
    test.slow();

    // Step 1 — the admin looks up an employee by name.
    const chosen = await employeeListPage.selectEmployeeName('a');
    await employeeListPage.search();
    await expect(employeeListPage.rows.first()).toBeVisible();

    // Step 2 — the result matches who they searched for.
    const first = await employeeListPage.cell(0, EmployeeColumn.FirstName).textContent();
    const last = await employeeListPage.cell(0, EmployeeColumn.LastName).textContent();
    const rowName = `${first} ${last}`.replace(/\s+/g, ' ').trim();
    expect(rowName).toBe(chosen.replace(/\s+/g, ' ').trim());

    // Step 3 — they open the record.
    await employeeListPage.openRecord(0);

    const record = new EmployeeRecordPage(page);
    await record.waitForReady();
    await record.expectTabsVisible();
    const empNumber = record.employeeNumber();

    // Step 4 — they work through every section of the file. The record must stay
    // on the same employee throughout; a tab that silently switched employee
    // would be a serious defect in an audit context.
    for (const tab of Object.keys(EMPLOYEE_RECORD_TABS) as EmployeeRecordTab[]) {
      await record.openTab(tab);
      expect(record.employeeNumber(), `"${tab}" should stay on employee ${empNumber}`).toBe(empNumber);
    }
  });

  test('returns to the full list after the audit @journey', async ({ employeeListPage }) => {
    await employeeListPage.selectEmployeeName('a');
    await employeeListPage.search();
    await expect(employeeListPage.rows.first()).toBeVisible();

    // Clearing the filter puts the admin back to the full employee population.
    await employeeListPage.reset();

    await employeeListPage.expectSomeRecords();
    expect(await employeeListPage.rows.count()).toBeGreaterThan(1);
  });
});
