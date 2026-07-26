import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { CREDENTIALS, ROUTES } from '../../utils/test-data';

/**
 * Anonymous specs. These import from `@playwright/test` rather than the app
 * fixture so they run without the stored admin session.
 */
test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('signs in with valid credentials and lands on the dashboard @smoke', async ({ page }) => {
    await loginPage.login(CREDENTIALS.admin.username, CREDENTIALS.admin.password);

    await expect(page).toHaveURL(/\/dashboard\/index$/);
    await expect(page.getByRole('banner').getByRole('heading', { level: 6 })).toHaveText('Dashboard');
  });

  test('rejects an invalid password and stays on the login page', async ({ page }) => {
    await loginPage.login(CREDENTIALS.invalid.username, CREDENTIALS.invalid.password);

    await loginPage.expectErrorMessage('Invalid credentials');
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('rejects an unknown username', async () => {
    await loginPage.login('no-such-user', 'irrelevant');

    await loginPage.expectErrorMessage('Invalid credentials');
  });

  test('marks both fields required when submitted empty', async ({ page }) => {
    await loginPage.submitEmpty();

    // One "Required" message per empty field. These are role-less spans, so the
    // count is what distinguishes them from the credentials banner.
    await loginPage.expectRequiredFieldErrors(2);
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('keeps the password field masked', async () => {
    await loginPage.passwordInput.fill('some-secret');

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('navigates to the password reset page', async ({ page }) => {
    await loginPage.gotoForgotPassword();

    await expect(page).toHaveURL(new RegExp(`${ROUTES.resetPassword}$`));
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    // Deliberately not submitting: this is a shared public demo and a real reset
    // would disrupt the Admin account other users depend on.
  });
});

test.describe('Route protection', () => {
  const protectedRoutes = [
    { name: 'dashboard', path: ROUTES.dashboard },
    { name: 'employee list', path: ROUTES.employeeList },
    { name: 'my info', path: ROUTES.myInfo },
  ];

  for (const route of protectedRoutes) {
    test(`redirects an anonymous visitor from the ${route.name} to login`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });
  }
});
