import { Page, Locator } from '@playwright/test';
import { TableListPage } from './list.page';
import { ROUTES } from '../utils/test-data';

/** Zero-based cell positions in an employee row. Column 0 is the row checkbox. */
export const EmployeeColumn = {
  Select: 0,
  Id: 1,
  FirstName: 2,
  LastName: 3,
  JobTitle: 4,
  EmploymentStatus: 5,
  SubUnit: 6,
  Supervisor: 7,
  Actions: 8,
} as const;

/**
 * PIM > Employee List.
 *
 * Filtering mechanics, grid access and the header-matching rules live in
 * `TableListPage` — this class only adds what is specific to employees.
 */
export class EmployeeListPage extends TableListPage {
  readonly filterTitle: Locator;
  readonly employeeNameInput: Locator;
  readonly employeeIdInput: Locator;
  readonly addButton: Locator;

  protected readonly apiPath = '/api/v2/pim/employees';
  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.filterTitle = page.getByRole('heading', { name: 'Employee Information' });
    this.employeeNameInput = this.filterField('Employee Name').getByRole('textbox');
    this.employeeIdInput = this.filterField('Employee Id').getByRole('textbox');
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.readyIndicator = this.filterTitle;
  }

  /**
   * Navigates and waits for the first employee query to resolve, so the grid,
   * results banner and pagination are all present before a test inspects them.
   */
  async goto(): Promise<void> {
    await this.withRefresh(() => this.navigate(ROUTES.employeeList));
    await this.waitForReady();
  }

  async fillEmployeeId(id: string): Promise<void> {
    await this.employeeIdInput.fill(id);
  }

  /** Types into the employee-name autocomplete and picks a suggestion. */
  async selectEmployeeName(partialName: string): Promise<string> {
    return this.selectAutocomplete('Employee Name', partialName);
  }

  /** Opens the record of a row by clicking its first name cell. */
  async openRecord(rowIndex = 0): Promise<void> {
    await this.cell(rowIndex, EmployeeColumn.FirstName).click();
    await this.page.waitForURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+$/);
  }
}
