import { Page, Locator, expect } from '@playwright/test';
import { ListPage } from './list.page';
import { ROUTES } from '../utils/test-data';

/**
 * Directory.
 *
 * The only list screen that is not a grid — results are rendered as cards, so it
 * extends `ListPage` (filter panel, search/reset, results banner) rather than
 * `TableListPage`.
 */
export class DirectoryPage extends ListPage {
  readonly filterTitle: Locator;
  readonly cards: Locator;

  protected readonly apiPath = '/api/v2/directory/employees';
  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    // Level 5 matters: "Directory" is also the module name in the top bar, so an
    // unqualified heading locator matches both the `h6` and this `h5`.
    this.filterTitle = page.getByRole('heading', { name: 'Directory', level: 5 });
    // Cards carry no role or accessible name; the class hook is the only handle.
    this.cards = page.locator('.orangehrm-directory-card');
    this.readyIndicator = this.filterTitle;
  }

  /**
   * Asserts every visible card shows `expected` as its job title, retrying until
   * the card list has re-rendered after a filter.
   */
  async expectEveryCardJobTitle(expected: string): Promise<void> {
    await expect
      .poll(async () => (await this.cardJobTitles()).filter((title) => title !== expected), {
        message: `every card should show job title "${expected}"`,
      })
      .toEqual([]);
  }

  /** As above, for the location line. */
  async expectEveryCardLocation(expected: string): Promise<void> {
    await expect
      .poll(async () => (await this.cardLocations()).filter((location) => location !== expected), {
        message: `every card should show location "${expected}"`,
      })
      .toEqual([]);
  }

  async goto(): Promise<void> {
    await this.withRefresh(() => this.navigate(ROUTES.directory));
    await this.waitForReady();
  }

  /**
   * Job title shown on each visible card.
   *
   * Frequently empty — most demo employees have no job title set — so callers
   * that need a real value should filter out the blanks.
   */
  async cardJobTitles(): Promise<string[]> {
    const titles = this.cards.locator('.orangehrm-directory-card-subtitle');
    return (await titles.allTextContents()).map((t) => t.trim());
  }

  /**
   * A card carries two description lines: sub unit first, then location. They
   * share a class, so they are read positionally per card — flattening them into
   * one list would silently mix the two fields.
   */
  private async cardDescription(index: 0 | 1): Promise<string[]> {
    return this.cards.evaluateAll(
      (cards, i) =>
        cards.map((card) => {
          const lines = card.querySelectorAll('.orangehrm-directory-card-description');
          return (lines[i]?.textContent ?? '').trim();
        }),
      index,
    );
  }

  /** Sub unit shown on each visible card. */
  async cardSubUnits(): Promise<string[]> {
    return this.cardDescription(0);
  }

  /** Location shown on each visible card. */
  async cardLocations(): Promise<string[]> {
    return this.cardDescription(1);
  }

  async filterByJobTitle(jobTitle: string): Promise<void> {
    await this.selectDropdown('Job Title', jobTitle);
  }

  async filterByLocation(location: string): Promise<void> {
    await this.selectDropdown('Location', location);
  }
}
