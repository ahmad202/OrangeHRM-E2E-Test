import { Page, Locator, expect } from '@playwright/test';

/**
 * The left-hand module navigation, present on every authenticated page.
 *
 * Every module is a real `<a href>`, so `getByRole('link')` is used throughout.
 */
export class SideMenu {
  readonly root: Locator;
  readonly searchInput: Locator;
  readonly moduleLinks: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('navigation', { name: 'Sidepanel' });
    this.searchInput = this.root.getByRole('textbox', { name: 'Search' });
    this.moduleLinks = this.root.getByRole('listitem').getByRole('link');
  }

  module(name: string): Locator {
    return this.root.getByRole('link', { name, exact: true });
  }

  async openModule(name: string): Promise<void> {
    await this.module(name).click();
  }

  /** Types into the side panel's module filter box. */
  async filterModules(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  async visibleModuleNames(): Promise<string[]> {
    const names = await this.moduleLinks.allTextContents();
    return names.map((n) => n.trim()).filter(Boolean);
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}
