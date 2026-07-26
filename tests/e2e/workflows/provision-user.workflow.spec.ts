import { test, expect } from '../../fixtures/app.fixture';
import { AddUserPage } from '../../pages/add-user.page';
import { SystemUsersPage, SystemUserColumn } from '../../pages/system-users.page';
import { WRITES_ENABLED, uniqueSuffix } from '../../utils/test-data';

/**
 * Workflow: provision a system user (create -> verify -> revoke).
 *
 * Business process — an administrator grants an existing employee access to
 * OrangeHRM, confirms the account shows up in the register with the right role
 * and status, and can revoke it again.
 *
 * OPT-IN and NOT VERIFIED END-TO-END — see the note in
 * `hire-employee.workflow.spec.ts`; the same caveats apply. Creating a login on
 * a shared public instance is worse than creating an employee record, so this
 * one especially should only be run against an instance you own.
 */
test.describe('Workflow: provision a system user', () => {
  test.skip(!WRITES_ENABLED, 'Write workflows are opt-in — set E2E_ALLOW_WRITES=1 to run them');

  const created: string[] = [];

  test.afterEach(async ({ page }) => {
    for (const username of created.splice(0)) {
      const users = new SystemUsersPage(page);
      await users.goto();
      await users.filterByUsername(username);
      await users.search();

      if ((await users.rows.count()) > 0) {
        await users.deleteRow(0);
      }
    }
  });

  test('grants an employee access and confirms the account @workflow', async ({ page }) => {
    const username = `e2e_user_${uniqueSuffix()}`;

    // Step 1 — the admin opens the new-user form.
    const addUser = new AddUserPage(page);
    await addUser.goto();

    // Step 2 — they attach the account to a real employee, chosen from the
    // autocomplete because the form rejects free text.
    await addUser.fillNewUser({
      role: 'ESS',
      employeeSearchTerm: 'a',
      status: 'Enabled',
      username,
      password: 'E2ePassw0rd!23',
    });

    // Step 3 — saving returns to the register.
    await addUser.saveAndReturnToList();
    created.push(username);

    // Step 4 — the account exists with the role and status that were requested.
    const users = new SystemUsersPage(page);
    await users.waitForReady();
    await users.filterByUsername(username);
    await users.search();

    await expect(users.rows).toHaveCount(1);
    await expect(users.cell(0, SystemUserColumn.Username)).toHaveText(username);
    await expect(users.cell(0, SystemUserColumn.UserRole)).toHaveText('ESS');
    await expect(users.cell(0, SystemUserColumn.Status)).toHaveText('Enabled');
  });

  test('rejects an incomplete account @workflow', async ({ page }) => {
    const addUser = new AddUserPage(page);
    await addUser.goto();

    await addUser.save();

    // Role, employee, username and both password fields are all mandatory.
    await expect(addUser.fieldErrors.first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/saveSystemUser$/);
  });
});
