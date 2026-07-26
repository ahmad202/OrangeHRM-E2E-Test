import { Page, Locator } from '@playwright/test';
import { FormPage } from './form.page';
import { ROUTES } from '../utils/test-data';

/**
 * PIM > Add Employee.
 *
 * The name fields sit in nested input groups that have no label of their own —
 * only the outer "Employee Full Name" group is labelled — so they are located by
 * placeholder rather than by the usual label scoping.
 */
export class AddEmployeePage extends FormPage {
  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;

  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.middleNameInput = page.getByPlaceholder('Middle Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.employeeIdInput = this.field('Employee Id').getByRole('textbox');
    this.readyIndicator = this.firstNameInput;
  }

  async goto(): Promise<void> {
    await this.navigate(ROUTES.addEmployee);
    await this.waitForReady();
  }

  async fillnames(firstName: string, lastName: string, middleName?: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    if (middleName) await this.middleNameInput.fill(middleName);
    await this.lastNameInput.fill(lastName);
  }

  /** The auto-generated employee id the form pre-fills. */
  async employeeId(): Promise<string> {
    return this.employeeIdInput.inputValue();
  }

  /**
   * Saves and waits for the redirect onto the new employee's record, which is
   * where OrangeHRM lands after a successful create.
   *
   * @returns the new employee's internal number, taken from the URL.
   */
  async saveAndOpenRecord(): Promise<string> {
    await this.save();
    await this.page.waitForURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+$/);

    const match = this.page.url().match(/empNumber\/(\d+)/);
    if (!match) throw new Error(`No empNumber after save: ${this.page.url()}`);
    return match[1];
  }
}
