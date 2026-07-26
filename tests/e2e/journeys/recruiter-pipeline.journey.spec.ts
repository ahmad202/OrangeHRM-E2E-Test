import { test, expect } from '../../fixtures/app.fixture';
import { CandidateColumn } from '../../pages/candidates.page';

/**
 * Journey: recruiter reviews the hiring pipeline.
 *
 * Business process — a recruiter works the candidate pipeline by stage:
 * narrow to a stage, confirm the shortlist is accurate, then widen back out.
 *
 * Read-only: no candidate is created, advanced or rejected.
 */
test.describe('Journey: recruiter pipeline review', () => {
  test('narrows the pipeline to one stage and back out again @journey', async ({ candidatesPage }) => {
    // Step 1 — the recruiter starts from the full pipeline.
    await candidatesPage.expectSomeRecords();
    const total = await candidatesPage.rows.count();
    expect(total).toBeGreaterThan(0);

    // Step 2 — they focus on candidates that have been shortlisted.
    await candidatesPage.filterByStatus('Shortlisted');
    await candidatesPage.search();

    // Step 3 — every candidate on screen really is at that stage. A stage filter
    // that leaks other candidates would have a recruiter contacting the wrong people.
    await expect(candidatesPage.rows.first()).toBeVisible();
    await candidatesPage.expectEveryRowInColumn(CandidateColumn.Status, 'Shortlisted');
    const shortlisted = await candidatesPage.rows.count();
    expect(shortlisted).toBeGreaterThan(0);

    // Step 4 — clearing the filter restores the whole pipeline.
    await candidatesPage.reset();
    await candidatesPage.expectSomeRecords();
    expect(await candidatesPage.rows.count()).toBeGreaterThanOrEqual(shortlisted);
  });

  test('shows the pipeline grid with its business columns @journey', async ({ candidatesPage }) => {
    for (const column of ['Vacancy', 'Candidate', 'Hiring Manager', 'Date of Application', 'Status']) {
      await expect.soft(candidatesPage.column(column), `column "${column}"`).toBeVisible();
    }
  });

  /**
   * Consistency check across stages. This asserts only that a stage filter never
   * returns a candidate from another stage — it tolerates a stage being empty,
   * since which stages have candidates changes constantly on a shared instance.
   */
  for (const status of ['Application Initiated', 'Interview Scheduled', 'Rejected']) {
    test(`only returns "${status}" candidates when filtered to that stage @journey`, async ({
      candidatesPage,
    }) => {
      await candidatesPage.filterByStatus(status);
      await candidatesPage.search();

      await candidatesPage.expectEveryRowInColumn(CandidateColumn.Status, status);
    });
  }
});
