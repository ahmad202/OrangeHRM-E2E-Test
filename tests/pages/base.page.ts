import { Page, Locator, expect } from '@playwright/test';

/**
 * Shared behaviour for every page object.
 *
 * Note there is no `networkidle` helper here. OrangeHRM keeps background
 * requests in flight after the page is usable, so waiting for an idle network
 * is both slow and unreliable. Each concrete page instead exposes a
 * `readyIndicator` — a locator that is only present once the page is genuinely
 * interactive — and readiness is asserted against that.
 */
export abstract class BasePage {
  readonly page: Page;

  /** Locator that proves this page has finished rendering. */
  protected abstract readonly readyIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** Waits until the page's own readiness signal is visible. */
  async waitForReady(): Promise<void> {
    await expect(this.readyIndicator).toBeVisible();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }
}
