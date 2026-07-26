import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { SideMenu } from './components/side-menu.component';
import { TopBar } from './components/top-bar.component';
import { ConfirmDialog } from './components/confirm-dialog.component';

/**
 * Shared behaviour for OrangeHRM's filterable list screens.
 *
 * PIM employees, Admin system users, Recruitment candidates and the Directory
 * all render the same `.oxd-table-filter` shell — same Search/Reset buttons,
 * same custom dropdowns, same "(N) Records Found" banner — so the filtering
 * mechanics live here once.
 *
 * Subclasses supply `apiPath`, the endpoint whose response marks a refresh as
 * complete. Waiting on that response is what stops assertions from running
 * against the previous, unfiltered result set.
 */
export abstract class ListPage extends BasePage {
  readonly sideMenu: SideMenu;
  readonly topBar: TopBar;

  readonly filterPanel: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly recordCount: Locator;
  readonly pagination: Locator;

  /** Endpoint fragment that signals this list has reloaded, e.g. `/api/v2/admin/users`. */
  protected abstract readonly apiPath: string;

  constructor(page: Page) {
    super(page);
    this.sideMenu = new SideMenu(page);
    this.topBar = new TopBar(page);

    this.filterPanel = page.locator('.oxd-table-filter');
    this.searchButton = this.filterPanel.getByRole('button', { name: 'Search' });
    this.resetButton = this.filterPanel.getByRole('button', { name: 'Reset' });

    // Renders as "(N) Records Found", "(1) Record Found", or "No Records Found".
    this.recordCount = page.locator('.orangehrm-horizontal-padding.orangehrm-vertical-padding');
    this.pagination = page.getByRole('navigation', { name: 'Pagination Navigation' });
  }

  /** Scopes to one filter control by its visible caption. */
  protected filterField(label: string): Locator {
    return this.filterPanel.locator('.oxd-input-group').filter({ hasText: label });
  }

  /**
   * Runs an action that refreshes the list and waits for its query to return.
   *
   * Without this the previous rows are still on screen when the next assertion
   * runs, so a filter appears not to have applied. Waiting on the response is
   * deterministic, unlike a fixed sleep.
   */
  protected async withRefresh(action: () => Promise<void>): Promise<void> {
    const response = this.page.waitForResponse(
      (res) => res.url().includes(this.apiPath) && res.request().method() === 'GET',
    );
    await action();
    await response;
  }

  /**
   * Opens a custom dropdown and picks an option.
   *
   * The app contains no native `<select>`, so `selectOption()` is unusable. The
   * trigger is a role-less `<div>` and needs CSS; the option itself is a proper
   * `role="option"` and is selected semantically.
   */
  async selectDropdown(label: string, optionName: string): Promise<void> {
    await this.filterField(label).locator('.oxd-select-text').click();
    await this.page.getByRole('option', { name: optionName, exact: true }).click();
  }

  /**
   * Types into an autocomplete field and picks the first real suggestion.
   *
   * A transient "Searching...." entry shares the `option` role; selecting it
   * silently leaves the filter unset, so it is excluded and the locator retries
   * until a genuine suggestion arrives.
   *
   * @returns the text of the suggestion that was selected.
   */
  /**
   * Picks the first real option from a dropdown and returns its text.
   *
   * Useful when a journey needs *a* valid value rather than a specific one —
   * the configured job titles, locations and sub-units differ per instance, so
   * hard-coding one makes the test a hostage to configuration.
   */
  async selectFirstOption(label: string): Promise<string> {
    await this.filterField(label).locator('.oxd-select-text').click();

    const option = this.page.getByRole('option').filter({ hasNotText: '-- Select --' }).first();
    await expect(option).toBeVisible();

    const chosen = ((await option.textContent()) ?? '').trim();
    await option.click();
    return chosen;
  }

  async selectAutocomplete(label: string, term: string): Promise<string> {
    await this.filterField(label).getByRole('textbox').fill(term);

    const option = this.page.getByRole('option').filter({ hasNotText: 'Searching' }).first();
    await expect(option).toBeVisible();

    const chosen = ((await option.textContent()) ?? '').trim();
    await option.click();
    return chosen;
  }

  async fillFilter(label: string, value: string): Promise<void> {
    await this.filterField(label).getByRole('textbox').fill(value);
  }

  async search(): Promise<void> {
    await this.withRefresh(() => this.searchButton.click());
  }

  async reset(): Promise<void> {
    await this.withRefresh(() => this.resetButton.click());
  }

  async expectNoRecords(): Promise<void> {
    await expect(this.recordCount).toHaveText('No Records Found');
  }

  /** Matches both the plural and singular forms of the results banner. */
  async expectSomeRecords(): Promise<void> {
    await expect(this.recordCount).toHaveText(/\(\d+\) Records? Found/);
  }
}

/**
 * A list screen backed by OrangeHRM's grid.
 *
 * The grid is a `<div role="table">` rather than a `<table>`, but exposes proper
 * `row` / `columnheader` / `cell` roles, so role-based locators work.
 */
export abstract class TableListPage extends ListPage {
  readonly table: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.table = page.getByRole('table');
    this.rows = page.locator('.oxd-table-body').getByRole('row');
  }

  /**
   * Matches a column header by its leading text.
   *
   * `{ exact: true }` never matches — the accessible name ends in a sort-icon
   * glyph. Substring matching is also wrong: `'Id'` matches two headers, because
   * it appears inside "First (& M**id**dle) Name". An anchored regex is the only
   * reliable form.
   */
  column(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.page.getByRole('columnheader', { name: new RegExp(`^${escaped}`) });
  }

  cell(rowIndex: number, column: number): Locator {
    return this.rows.nth(rowIndex).getByRole('cell').nth(column);
  }

  /**
   * All values in one column across the current page of results.
   *
   * This is a one-shot read. Immediately after a filter it can observe the
   * *previous* result set: waiting on the API response only proves the data
   * arrived, not that the grid has re-rendered with it. Prefer
   * `expectEveryRowInColumn` for assertions, and keep this for cases where the
   * raw values are needed (seeding a later step, counting).
   */
  async columnValues(column: number): Promise<string[]> {
    const cells = this.rows.locator(`[role=cell]:nth-child(${column + 1})`);
    return (await cells.allTextContents()).map((t) => t.trim());
  }

  /**
   * Asserts every row on the current page carries `expected` in the given column.
   *
   * Retries until the grid has actually re-rendered, which is what makes it safe
   * to call straight after a filter. An empty result set satisfies this — pair it
   * with a count assertion when the filter is expected to match something.
   */
  async expectEveryRowInColumn(column: number, expected: string): Promise<void> {
    await expect
      .poll(async () => (await this.columnValues(column)).filter((value) => value !== expected), {
        message: `every row should show "${expected}" in column ${column}`,
      })
      .toEqual([]);
  }

  /**
   * Delete / edit controls for a row.
   *
   * These icon buttons carry no accessible name, no `title` and no `aria-label`;
   * the only thing distinguishing them is the icon class on their child `<i>`.
   * CSS is unavoidable here.
   */
  rowAction(rowIndex: number, action: 'delete' | 'edit'): Locator {
    const icon = action === 'delete' ? 'bi-trash' : 'bi-pencil-fill';
    return this.rows.nth(rowIndex).locator(`button:has(i.${icon})`);
  }

  /**
   * Deletes a row and confirms the dialog, waiting for the list to reload.
   *
   * Only used by the opt-in write workflows — see `ConfirmDialog` for the caveat
   * about these selectors not being exercised against the shared demo.
   */
  async deleteRow(rowIndex = 0): Promise<void> {
    await this.rowAction(rowIndex, 'delete').click();
    const dialog = new ConfirmDialog(this.page);
    await this.withRefresh(() => dialog.confirm());
  }

  async expectNoRecords(): Promise<void> {
    await super.expectNoRecords();
    await expect(this.rows).toHaveCount(0);
  }
}
