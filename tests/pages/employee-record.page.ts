import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { SideMenu } from './components/side-menu.component';
import { TopBar } from './components/top-bar.component';
import { EMPLOYEE_RECORD_TABS, EmployeeRecordTab, ROUTES } from '../utils/test-data';

/**
 * An individual employee record (PIM > employee, and My Info for the signed-in
 * user — both render the same screen).
 *
 * The tabs are real anchors whose hrefs carry the employee number, so they are
 * matched with `getByRole('link')`, scoped to the tab strip to avoid colliding
 * with same-named links elsewhere on the page.
 */
export class EmployeeRecordPage extends BasePage {
  readonly sideMenu: SideMenu;
  readonly topBar: TopBar;
  readonly tabStrip: Locator;
  readonly tabs: Locator;
  /** The employee's name, shown as the second `h6` in the banner. */
  readonly employeeName: Locator;

  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.sideMenu = new SideMenu(page);
    this.topBar = new TopBar(page);
    this.tabStrip = page.locator('.orangehrm-tabs');
    this.tabs = this.tabStrip.getByRole('link');
    this.employeeName = this.topBar.subModuleTitle;
    this.readyIndicator = this.tabStrip;
  }

  /** Opens the signed-in user's own record via My Info. */
  async gotoMyInfo(): Promise<void> {
    await this.navigate(ROUTES.myInfo);
    await this.page.waitForURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+$/);
    await this.waitForReady();
  }

  tab(name: EmployeeRecordTab): Locator {
    return this.tabStrip.getByRole('link', { name, exact: true });
  }

  /**
   * Opens a section of the record.
   *
   * Each tab is a real `<a href>`, so this is a full document load rather than
   * client-side routing — a ten-tab walk reboots the whole Vue application ten
   * times. The tab is waited for before clicking (the strip may still be
   * mid-render from the previous navigation), and the strip is confirmed back
   * afterwards with a timeout sized for a page load rather than a repaint.
   */
  async openTab(name: EmployeeRecordTab): Promise<void> {
    const tab = this.tab(name);
    await expect(tab).toBeVisible();
    await tab.click();

    await expect(this.page).toHaveURL(EMPLOYEE_RECORD_TABS[name]);
    await expect(this.tabStrip).toBeVisible({ timeout: 30_000 });
  }

  /** The employee number embedded in the current URL. */
  employeeNumber(): string {
    const match = this.page.url().match(/empNumber\/(\d+)/);
    if (!match) throw new Error(`No empNumber in URL: ${this.page.url()}`);
    return match[1];
  }

  async expectTabsVisible(): Promise<void> {
    await expect(this.tabs).toHaveCount(Object.keys(EMPLOYEE_RECORD_TABS).length);
  }
}
