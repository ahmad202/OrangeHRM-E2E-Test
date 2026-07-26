import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Shared behaviour for OrangeHRM's create/edit forms.
 *
 * Structurally the same controls as the list filters, but inside `.oxd-form`
 * rather than `.oxd-table-filter`, so the field scoping differs.
 */
export abstract class FormPage extends BasePage {
  readonly form: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  /** Per-field validation messages; role-less spans, matched by class. */
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.locator('.oxd-form');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
    this.fieldErrors = page.locator('.oxd-input-field-error-message');
  }

  /** Scopes to one form control by its visible caption. */
  protected field(label: string): Locator {
    return this.form.locator('.oxd-input-group').filter({ hasText: label });
  }

  async fillField(label: string, value: string): Promise<void> {
    await this.field(label).getByRole('textbox').fill(value);
  }

  /** Opens a custom dropdown and picks an option. No native `<select>` exists. */
  async selectDropdown(label: string, optionName: string): Promise<void> {
    await this.field(label).locator('.oxd-select-text').click();
    await this.page.getByRole('option', { name: optionName, exact: true }).click();
  }

  /**
   * Types into an autocomplete and picks the first real suggestion, skipping the
   * transient "Searching...." placeholder that shares the `option` role.
   */
  async selectAutocomplete(label: string, term: string): Promise<string> {
    await this.field(label).getByRole('textbox').fill(term);

    const option = this.page.getByRole('option').filter({ hasNotText: 'Searching' }).first();
    await expect(option).toBeVisible();

    const chosen = ((await option.textContent()) ?? '').trim();
    await option.click();
    return chosen;
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}
