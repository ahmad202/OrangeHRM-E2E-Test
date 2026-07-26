import { test, expect } from '../../fixtures/app.fixture';

/**
 * Journey: employee looks someone up in the company directory.
 *
 * Business process — an employee needs a colleague's details and narrows the
 * directory by role or office until they find them.
 *
 * The directory is the one list screen rendered as cards rather than a grid, so
 * results are read from the card bodies.
 *
 * Read-only.
 */
test.describe('Journey: directory lookup', () => {
  test('browses the directory and narrows it by job title @journey', async ({ directoryPage }) => {
    // Step 1 — the employee opens the directory and sees colleagues.
    await directoryPage.expectSomeRecords();
    expect(await directoryPage.cards.count()).toBeGreaterThan(0);

    // Step 2 — they narrow to a role. The value is read off a colleague already
    // on screen rather than taken from the top of the dropdown: the dropdown
    // lists every configured job title, including ones nobody currently holds,
    // and filtering by one of those returns an empty directory.
    const titles = (await directoryPage.cardJobTitles()).filter(Boolean);
    test.skip(titles.length === 0, 'No employee on the first page has a job title set');
    const jobTitle = titles[0];

    await directoryPage.filterByJobTitle(jobTitle);
    await directoryPage.search();

    // Step 3 — everyone shown really does hold that job title.
    await directoryPage.expectEveryCardJobTitle(jobTitle);
    const matching = await directoryPage.cards.count();
    expect(matching).toBeGreaterThan(0);

    // Step 4 — clearing the filter restores the full directory.
    await directoryPage.reset();
    await directoryPage.expectSomeRecords();
    expect(await directoryPage.cards.count()).toBeGreaterThanOrEqual(matching);
  });

  test('narrows the directory by office location @journey', async ({ directoryPage }) => {
    // Same reasoning as above: source the office from someone actually listed.
    const locations = (await directoryPage.cardLocations()).filter(Boolean);
    test.skip(locations.length === 0, 'No employee on the first page has a location set');
    const location = locations[0];

    await directoryPage.filterByLocation(location);
    await directoryPage.search();

    await expect(directoryPage.cards.first()).toBeVisible();
    await directoryPage.expectEveryCardLocation(location);
  });

  test('finds a specific colleague by name @journey', async ({ directoryPage }) => {
    const chosen = await directoryPage.selectAutocomplete('Employee Name', 'a');
    await directoryPage.search();

    await expect(directoryPage.cards.first()).toBeVisible();

    // The card header shows the employee's name; the autocomplete label may carry
    // extra whitespace from an empty middle name, so both sides are normalised.
    // Names are not unique, so the assertion is on the match rather than on a count.
    const headers = directoryPage.cards.locator('.orangehrm-directory-card-header');
    await expect
      .poll(async () => (await headers.allTextContents()).map((h) => h.replace(/\s+/g, ' ').trim()))
      .toContain(chosen.replace(/\s+/g, ' ').trim());
  });
});
