import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { ROUTES } from '../utils/test-data';

/**
 * OrangeHRM login page.
 *
 * Selector notes, verified against OrangeHRM OS 5.9:
 *
 *  - `getByLabel()` is unusable on this form. The visible "Username" / "Password"
 *    captions are `<div class="oxd-label">` wrapped in a `<label>` that carries no
 *    `for` attribute, and the inputs have no `id`, no `aria-label` and no
 *    `aria-labelledby`. Nothing associates caption to control.
 *  - The inputs' accessible name therefore comes from their `placeholder`, which
 *    is why `getByRole('textbox', { name: ... })` still resolves them.
 *  - `getByTestId()` is unavailable: the application ships zero `data-testid`
 *    attributes on any page.
 */
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly requiredFieldErrors: Locator;
  readonly forgotPasswordLink: Locator;
  readonly heading: Locator;

  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Login' });
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });

    // The invalid-credentials banner is a genuine `role="alert"`.
    this.errorAlert = page.getByRole('alert');

    // Per-field "Required" messages are role-less spans, so they are matched by
    // text. Scoped by class to avoid colliding with incidental page copy.
    this.requiredFieldErrors = page.locator('.oxd-input-field-error-message');

    // "Forgot your password?" is a `<p>`, not a link or button — `getByRole('link')`
    // would never match it.
    this.forgotPasswordLink = page.getByText('Forgot your password?');

    this.readyIndicator = this.loginButton;
  }

  async goto(): Promise<void> {
    await this.navigate(ROUTES.login);
    await this.waitForReady();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async submitEmpty(): Promise<void> {
    await this.loginButton.click();
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(message);
  }

  async expectRequiredFieldErrors(count: number): Promise<void> {
    await expect(this.requiredFieldErrors).toHaveCount(count);
    await expect(this.requiredFieldErrors.first()).toHaveText('Required');
  }

  async gotoForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }
}
