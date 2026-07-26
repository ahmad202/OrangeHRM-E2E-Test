import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { SideMenu } from './components/side-menu.component';
import { TopBar } from './components/top-bar.component';
import { ROUTES } from '../utils/test-data';

/**
 * The post-login landing page.
 *
 * Widget titles are `<p>` elements inside each widget header, not headings, so
 * they are located by text rather than by role.
 */
export class DashboardPage extends BasePage {
  readonly sideMenu: SideMenu;
  readonly topBar: TopBar;
  readonly widgets: Locator;
  readonly quickLaunchButtons: Locator;

  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.sideMenu = new SideMenu(page);
    this.topBar = new TopBar(page);
    this.widgets = page.locator('.orangehrm-dashboard-widget');
    this.quickLaunchButtons = page.locator('.orangehrm-quick-launch-card button');
    this.readyIndicator = this.topBar.moduleTitle;
  }

  async goto(): Promise<void> {
    await this.navigate(ROUTES.dashboard);
    await this.waitForReady();
  }

  widget(title: string): Locator {
    return this.page.locator('.orangehrm-dashboard-widget-header').filter({ hasText: title });
  }

  quickLaunch(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${ROUTES.dashboard}$`));
    await this.topBar.expectModuleTitle('Dashboard');
  }
}
