import { Page, Locator } from '@playwright/test';
import { TableListPage } from './list.page';
import { ROUTES } from '../utils/test-data';

/** Zero-based cell positions in a candidate row. */
export const CandidateColumn = {
  Select: 0,
  Vacancy: 1,
  Candidate: 2,
  HiringManager: 3,
  DateOfApplication: 4,
  Status: 5,
  Actions: 6,
} as const;

/** Recruitment > Candidates. */
export class CandidatesPage extends TableListPage {
  readonly filterTitle: Locator;
  readonly addButton: Locator;

  protected readonly apiPath = '/api/v2/recruitment/candidates';
  protected readonly readyIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.filterTitle = page.getByRole('heading', { name: 'Candidates' });
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.readyIndicator = this.filterTitle;
  }

  async goto(): Promise<void> {
    await this.withRefresh(() => this.navigate(ROUTES.candidates));
    await this.waitForReady();
  }

  async filterByStatus(status: string): Promise<void> {
    await this.selectDropdown('Status', status);
  }
}
