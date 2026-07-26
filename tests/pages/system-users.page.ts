import { Page, Locator } from '@playwright/test';
import { TableListPage } from './list.page';
import { ROUTES } from '../utils/test-data';

/** Zero-based cell positions in a system-user row. */
export const SystemUserColumn = {
  Select: 0,
  Username: 1,
  UserRole: 2,
  EmployeeName: 3,
  Status: 4,
  Actions: 5,
} as const;

/** Admin > User Management > System Users. */
export class SystemUsersPage extends TableListPage {
  readonly filterTitle: Locator;
  readonly usernameInput: Locator;
  readonly addButton: Locator;

  protected readonly apiPath = '/api/v2/admin/users';
  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.filterTitle = page.getByRole('heading', { name: 'System Users' });
    this.usernameInput = this.filterField('Username').getByRole('textbox');
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.readyIndicator = this.filterTitle;
  }

  async goto(): Promise<void> {
    await this.withRefresh(() => this.navigate(ROUTES.systemUsers));
    await this.waitForReady();
  }

  async filterByUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }
}
