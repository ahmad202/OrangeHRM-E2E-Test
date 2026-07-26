import { Page, Locator } from '@playwright/test';
import { FormPage } from './form.page';
import { ROUTES } from '../utils/test-data';

export type NewUser = {
  role: 'Admin' | 'ESS';
  employeeSearchTerm: string;
  status: 'Enabled' | 'Disabled';
  username: string;
  password: string;
};

/**
 * Admin > User Management > Add User.
 *
 * Both password fields are `input[type=password]`, which has no stable implicit
 * ARIA role, so they are located by their labelled group rather than by role.
 */
export class AddUserPage extends FormPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = this.field('Username').getByRole('textbox');
    this.passwordInput = this.field('Password').locator('input[type=password]').first();
    this.confirmPasswordInput = this.field('Confirm Password').locator('input[type=password]').first();
    this.readyIndicator = this.saveButton;
  }

  async goto(): Promise<void> {
    await this.navigate(ROUTES.addSystemUser);
    await this.waitForReady();
  }

  /**
   * Fills the whole form.
   *
   * @returns the employee the account was attached to, as chosen from the
   *          autocomplete — the form rejects a free-text employee name.
   */
  async fillNewUser(user: NewUser): Promise<string> {
    await this.selectDropdown('User Role', user.role);
    const employee = await this.selectAutocomplete('Employee Name', user.employeeSearchTerm);
    await this.selectDropdown('Status', user.status);

    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(user.password);

    return employee;
  }

  /** Saves and waits for the redirect back to the system-user register. */
  async saveAndReturnToList(): Promise<void> {
    await this.save();
    await this.page.waitForURL(/\/admin\/viewSystemUsers$/);
  }
}
