import { test, expect } from '../../fixtures/app.fixture';
import { EmployeeColumn } from '../../pages/employee-list.page';
import { EMPLOYEE_LIST_COLUMNS, NONEXISTENT_EMPLOYEE_ID } from '../../utils/test-data';

const normalise = (value: string) => value.replace(/\s+/g, ' ').trim();

/**
 * The demo database is shared and mutated continuously by other users — the
 * record count moved from 173 to 180 while these tests were being written.
 * Nothing here asserts an exact count or a specific employee. Filter results are
 * instead checked for internal consistency: every returned row must satisfy the
 * filter that produced it.
 */
test.describe('PIM employee list', () => {
  test('renders the employee grid with all columns @smoke', async ({ employeeListPage }) => {
    await expect(employeeListPage.table).toBeVisible();

    for (const column of EMPLOYEE_LIST_COLUMNS) {
      await expect.soft(employeeListPage.column(column), `column "${column}"`).toBeVisible();
    }
  });

  test('shows a populated, correctly-labelled result set', async ({ employeeListPage }) => {
    await employeeListPage.expectSomeRecords();
    expect(await employeeListPage.rows.count()).toBeGreaterThan(0);
  });

  test('returns only matching rows when filtering by employment status', async ({ employeeListPage }) => {
    const status = 'Full-Time Permanent';

    await employeeListPage.selectDropdown('Employment Status', status);
    await employeeListPage.search();

    await expect(employeeListPage.rows.first()).toBeVisible();
    await employeeListPage.expectEveryRowInColumn(EmployeeColumn.EmploymentStatus, status);
    expect(await employeeListPage.rows.count()).toBeGreaterThan(0);
  });

  test('narrows results to the employee picked from the autocomplete', async ({ employeeListPage }) => {
    const chosen = await employeeListPage.selectEmployeeName('a');
    await employeeListPage.search();

    await expect(employeeListPage.rows.first()).toBeVisible();

    const first = await employeeListPage.cell(0, EmployeeColumn.FirstName).textContent();
    const last = await employeeListPage.cell(0, EmployeeColumn.LastName).textContent();

    expect(normalise(`${first} ${last}`)).toBe(normalise(chosen));
  });

  test('reports no records for an employee id that does not exist', async ({ employeeListPage }) => {
    await employeeListPage.fillEmployeeId(NONEXISTENT_EMPLOYEE_ID);
    await employeeListPage.search();

    await employeeListPage.expectNoRecords();
  });

  test('restores the full list after resetting filters', async ({ employeeListPage }) => {
    await employeeListPage.fillEmployeeId(NONEXISTENT_EMPLOYEE_ID);
    await employeeListPage.search();
    await employeeListPage.expectNoRecords();

    await employeeListPage.reset();

    await expect(employeeListPage.employeeIdInput).toHaveValue('');
    await employeeListPage.expectSomeRecords();
    expect(await employeeListPage.rows.count()).toBeGreaterThan(0);
  });

  test('pages through results', async ({ employeeListPage }) => {
    const pageTwo = employeeListPage.pagination.getByRole('button', { name: '2' });
    test.skip(!(await pageTwo.isVisible()), 'Fewer than two pages of employees exist right now');

    const firstPageIds = await employeeListPage.columnValues(EmployeeColumn.Id);
    await pageTwo.click();

    await expect(employeeListPage.rows.first()).toBeVisible();
    const secondPageIds = await employeeListPage.columnValues(EmployeeColumn.Id);

    expect(secondPageIds).not.toEqual(firstPageIds);
  });
});
