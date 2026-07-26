import { Page, Locator, expect } from '@playwright/test';

/**
 * The top bar: current module title on the left, user dropdown on the right.
 */
export class TopBar {
  readonly root: Locator;
  /**
   * Module title. OrangeHRM renders it as an `h6`, not an `h1`.
   *
   * Modules with a secondary nav (Admin, Time, Performance, Maintenance) render
   * *two* `h6` elements in the banner — the module name followed by the current
   * sub-page, e.g. "Admin" then "User Management". `.first()` pins this to the
   * module name and keeps the locator strict-mode safe across every page.
   */
  readonly moduleTitle: Locator;
  readonly subModuleTitle: Locator;
  readonly userDropdownTab: Locator;
  readonly logoutLink: Locator;
  readonly changePasswordLink: Locator;
  readonly aboutLink: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('banner');
    this.moduleTitle = this.root.getByRole('heading', { level: 6 }).first();
    this.subModuleTitle = this.root.getByRole('heading', { level: 6 }).nth(1);

    // CSS is required here: the dropdown trigger is a bare `<span>` with no
    // role, no accessible name and no data-* hook, so no getBy* locator can
    // reach it. Verified against OrangeHRM OS 5.9.
    this.userDropdownTab = this.root.locator('.oxd-userdropdown-tab');

    // The menu entries are anchors, but each carries an explicit
    // `role="menuitem"` which overrides the implicit link role — so
    // `getByRole('link')` does not match them.
    this.logoutLink = page.getByRole('menuitem', { name: 'Logout' });
    this.changePasswordLink = page.getByRole('menuitem', { name: 'Change Password' });
    this.aboutLink = page.getByRole('menuitem', { name: 'About' });
  }

  async openUserMenu(): Promise<void> {
    await this.userDropdownTab.click();
    await expect(this.logoutLink).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutLink.click();
  }

  async expectModuleTitle(title: string): Promise<void> {
    await expect(this.moduleTitle).toHaveText(title);
  }
}
