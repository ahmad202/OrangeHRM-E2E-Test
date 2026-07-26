import { test, expect } from '../../fixtures/app.fixture';
import { SystemUserColumn } from '../../pages/system-users.page';
import { USER_ROLES, USER_STATUSES } from '../../utils/test-data';

/**
 * Journey: administrator audits who has access.
 *
 * Business process — a periodic access review. The admin lists system users,
 * narrows by privilege level and by account status, and confirms the answers
 * are trustworthy. Getting this wrong means either over-privileged accounts go
 * unnoticed or disabled accounts look active.
 *
 * Read-only: no user is created, edited or deleted.
 */
test.describe('Journey: user access audit', () => {
  test('reviews the system user register @journey', async ({ systemUsersPage }) => {
    await systemUsersPage.expectSomeRecords();
    expect(await systemUsersPage.rows.count()).toBeGreaterThan(0);

    for (const column of ['Username', 'User Role', 'Employee Name', 'Status']) {
      await expect.soft(systemUsersPage.column(column), `column "${column}"`).toBeVisible();
    }
  });

  // Privilege review: filtering to a role must never surface another role.
  for (const role of USER_ROLES) {
    test(`lists only ${role} accounts when filtered to that role @journey`, async ({ systemUsersPage }) => {
      await systemUsersPage.selectDropdown('User Role', role);
      await systemUsersPage.search();

      await systemUsersPage.expectEveryRowInColumn(SystemUserColumn.UserRole, role);
    });
  }

  // Account-status review: same guarantee for enabled vs disabled.
  for (const status of USER_STATUSES) {
    test(`lists only ${status} accounts when filtered to that status @journey`, async ({
      systemUsersPage,
    }) => {
      await systemUsersPage.selectDropdown('Status', status);
      await systemUsersPage.search();

      await systemUsersPage.expectEveryRowInColumn(SystemUserColumn.Status, status);
    });
  }

  test('looks up a single account by username and clears the filter @journey', async ({
    systemUsersPage,
  }) => {
    // Step 1 — the admin takes a username straight off the register, so the
    // journey does not depend on any particular account existing.
    const usernames = await systemUsersPage.columnValues(SystemUserColumn.Username);
    expect(usernames.length).toBeGreaterThan(0);
    const target = usernames[0];

    // Step 2 — they search for that account specifically.
    await systemUsersPage.filterByUsername(target);
    await systemUsersPage.search();

    const found = await systemUsersPage.columnValues(SystemUserColumn.Username);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((u) => u.includes(target))).toBe(true);

    // Step 3 — resetting returns the full register.
    await systemUsersPage.reset();
    await systemUsersPage.expectSomeRecords();
  });

  test('reports no records for an account that does not exist @journey', async ({ systemUsersPage }) => {
    await systemUsersPage.filterByUsername('zz-no-such-account');
    await systemUsersPage.search();

    await systemUsersPage.expectNoRecords();
  });
});
