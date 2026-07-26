import { Page, Locator, expect } from '@playwright/test';

/**
 * OrangeHRM's destructive-action confirmation dialog.
 *
 * NOTE: unlike the rest of this suite, these selectors were not exercised
 * end-to-end against the live demo — confirming a deletion on a shared public
 * instance destroys another user's data. They follow OrangeHRM 5.x's standard
 * dialog markup and are reached only from the opt-in write workflows. Verify
 * them against your own instance before relying on them.
 */
export class ConfirmDialog {
  readonly root: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.oxd-dialog-container');
    this.confirmButton = page.getByRole('button', { name: 'Yes, Delete' });
    this.cancelButton = page.getByRole('button', { name: 'No, Cancel' });
  }

  async expectOpen(): Promise<void> {
    await expect(this.confirmButton).toBeVisible();
  }

  async confirm(): Promise<void> {
    await this.expectOpen();
    await this.confirmButton.click();
    await expect(this.confirmButton).toBeHidden();
  }

  async dismiss(): Promise<void> {
    await this.expectOpen();
    await this.cancelButton.click();
    await expect(this.confirmButton).toBeHidden();
  }
}
