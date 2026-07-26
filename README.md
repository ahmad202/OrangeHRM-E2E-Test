# OrangeHRM E2E Suite

Playwright end-to-end tests for the [OrangeHRM open-source demo](https://opensource-demo.orangehrmlive.com/web/index.php/auth/login) (OS 5.9).

Every locator in this suite was derived by driving the live application and reading
its actual accessibility tree — not from assumption. The notes below record what
was found, because several of OrangeHRM's patterns defeat the obvious approach.

## Running

```bash
npm install
npx playwright install            # or: npx playwright install chromium

npm test                          # chromium only (fastest)
npm run test:all                  # chromium + firefox + webkit
npm run test:smoke                # @smoke subset
npm run test:journeys             # business journeys only
npm run test:workflows            # write-path workflows (opt-in — see below)
npm run test:ui                   # interactive UI mode
npm run report                    # open the last HTML report
```

Point at a different instance with `BASE_URL`, `ORANGEHRM_USERNAME` and
`ORANGEHRM_PASSWORD`.

`BASE_URL` accepts **any URL on the instance**, not just its origin — a login URL
copied out of the browser bar works as well as a bare origin, since every route in
the suite is an absolute path and only the origin is ever used:

```bash
BASE_URL=https://hr.example.com                             npm test
BASE_URL=https://hr.example.com/web/index.php/auth/login    npm test   # same thing
```

A value that isn't a parseable URL is a hard error rather than a silent fallback —
quietly testing the public demo when you meant your own instance is the worse
failure.

**Status:** green across Chromium, Firefox and WebKit — a representative run is
169 passing / 12 skipped in ~4 min.

Two things make those numbers move between runs, both by design:

- **12 skips are constant** — the opt-in write-path workflows (4 specs × 3
  browsers). See [Write-path workflows](#write-path-workflows).
- **A few more skips are data-dependent.** Some directory journeys need an
  employee with a job title or office set; when the shared demo has none on the
  first page they skip with a stated reason rather than failing. A later run saw
  18 skips for exactly that reason.

Under full three-browser parallelism the public demo also gets slow enough to
produce the occasional retry-recovered flake; the same specs pass repeatedly in
isolation. Run one browser at a time (`npm test`) for the cleanest signal.

Full test-case register, including step-by-step expected results:
[docs/test-cases.md](docs/test-cases.md). CI pipeline: [Continuous integration](#continuous-integration).

## Layout

```
tests/
  e2e/
    auth.setup.ts              logs in once, saves storage state
    auth/login.spec.ts         anonymous: credentials, validation, route protection
    auth/logout.spec.ts        owns its own session (see "Session isolation")
    auth/session.spec.ts       non-destructive checks on the shared session
    dashboard/dashboard.spec.ts  widgets, quick launch, module navigation
    pim/employee-list.spec.ts    grid, filters, autocomplete, pagination
    journeys/                  end-to-end business journeys (read-only)
      hr-record-audit           find an employee, open and review the whole file
      employee-self-service     My Info, scoped to the signed-in employee
      recruiter-pipeline        candidate pipeline by stage
      user-access-audit         who has access, by role and status
      directory-lookup          find a colleague by role, office or name
      full-session              sign-in -> work across modules -> sign-out
    workflows/                 write-path processes (opt-in, self-cleaning)
      hire-employee             add a new starter, verify, remove
      provision-user            grant an employee access, verify, revoke
  fixtures/app.fixture.ts      page-object fixtures + stored auth state
  pages/                       page objects
    list.page.ts               shared filter/grid mechanics for every list screen
    form.page.ts               shared create/edit form mechanics
    components/                top bar, side menu, confirm dialog
  utils/test-data.ts           credentials, routes, module map, constants
docs/test-cases.md             test-case register (journeys + workflows)
.github/workflows/e2e.yml      manual-trigger CI pipeline
```

Every list screen in OrangeHRM — PIM employees, system users, candidates, the
directory — renders the same `.oxd-table-filter` shell, so the filtering,
dropdown and pagination mechanics live once in `list.page.ts`. The directory is
the only one that renders cards instead of a grid.

## Write-path workflows

Real HR processes (hiring, provisioning access) are inherently write operations,
so they cannot be exercised read-only. They are implemented, tagged `@workflow`,
and **skipped unless `E2E_ALLOW_WRITES=1`**:

```bash
npm run test:workflows
```

Two things to know before enabling them:

- **They are not verified end-to-end.** Selectors were read off the live
  application, but the create and delete steps were never executed against it —
  the default target is a shared public demo. Treat them as reviewed-but-unrun
  until they pass against an instance you own.
- **They clean up after themselves.** Each creates records with a unique,
  obviously-synthetic identifier and removes them in `afterEach`, so a failure
  part-way through does not leave orphans. Point `BASE_URL` at your own instance
  rather than running them against the public demo.

## Continuous integration

[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) — GitHub Actions,
**manual trigger only**. Run it from *Actions → E2E → Run workflow*.

There are deliberately no `push`, `pull_request` or `schedule` triggers. The
default target is a shared public demo, so running on every push would hammer a
resource other people depend on and produce noisy, data-driven failures. The
commented-out triggers at the top of the file are the ones to enable once this
points at an instance you own.

### Inputs

| Input | Default | Notes |
| --- | --- | --- |
| `suite` | `all` | `all` · `read-only` · `smoke` · `journeys` · `functional` · `workflows` |
| `browser` | `chromium` | `chromium` · `firefox` · `webkit` · `all` |
| `base_url` | the public demo login URL | Any URL on the instance; normalised to its origin |
| `allow_writes` | `false` | Enables the write-path specs; rejected against the public demo |

What each `suite` selects, verified with `--list` against a single browser:

| Suite | Tests (incl. the 1 setup test) | Selects |
| --- | --- | --- |
| `all` | 61 | Everything — identical to running with no filter |
| `read-only` | 57 | Everything bar the write path |
| `functional` | 37 | Screen-level specs, no journeys |
| `journeys` | 21 | `@journey` |
| `smoke` | 7 | `@smoke` |
| `workflows` | 5 | `@workflow` only |

`all` and `read-only` differ only in how the 4 write-path specs are reported. Both
leave your data alone unless `allow_writes` is set:

- `all` **selects** them, and they skip themselves via `E2E_ALLOW_WRITES` — so the
  run shows the full inventory, with the write path visibly skipped.
- `read-only` **filters them out**, so the run is free of skip noise.

Pick `all` when you want to see everything that exists; `read-only` when you want a
clean pass/fail signal.

### Two things the pipeline gets right that are easy to miss

- **Chromium is always installed.** The `setup` project declares no `use` block,
  so it runs in chromium whatever else is selected. A firefox-only run that
  installed only firefox would fail before a single test executed.
- **Write runs are refused against the public demo.** A guard step fails the job
  if `allow_writes` (or `suite: workflows`) is used with a blank `base_url` or one
  pointing at `opensource-demo.orangehrmlive.com`. Untrusted input is passed via
  `env:` rather than interpolated into the shell, so the check cannot be worked
  around through the input box.

### Reports

The HTML report, JUnit XML and traces upload as an artifact on every run,
including failures. Failures also appear as inline GitHub annotations.

> **Before pointing this at a private instance:** Playwright traces and videos
> capture network requests, including session cookies and auth headers. Artifacts
> are readable by anyone with read access to the repository. Retention is set to
> 7 days; tighten `trace`/`video` in `playwright.config.ts` if your instance holds
> real personnel data.

Credentials come from the `ORANGEHRM_USERNAME` / `ORANGEHRM_PASSWORD` repository
secrets when set. They are optional — the public demo prints its own credentials
on its login page, and those are the fallback.

### Getting it running

This directory is not yet a git repository. To put the pipeline in front of
GitHub Actions:

```bash
git init -b main
git add .
git commit -m "Playwright E2E suite for OrangeHRM"
gh repo create <name> --private --source=. --push
```

Then open *Actions → E2E → Run workflow*. The defaults — `suite: all`,
`browser: chromium` — run every test case in roughly 2–3 minutes, with the
write-path specs skipped. Switch `browser` to `all` for the full cross-browser
sweep (~4–6 min).

## What the live application actually does

These are the findings that shaped the code. Each one broke a first attempt.

### Session isolation — the important one

`storageState` is only a cookie. Every test that loads it points at **one
server-side session**. A test that reuses the shared state and then logs out
destroys that session for every test still running, which surfaces as unrelated
specs being bounced to the login page.

The first full run failed 25 tests this way. Logout specs therefore run without
the stored state and log in through the UI first, so the session they end is
their own. See [logout.spec.ts](tests/e2e/auth/logout.spec.ts).

### Selectors

| Intent | Works | Why not the obvious choice |
| --- | --- | --- |
| Login fields | `getByRole('textbox', { name: 'Username' })` | `getByLabel` fails — `<label>` has no `for`, inputs have no `id`. The accessible name comes from `placeholder`. |
| Any element | — | `getByTestId` is unavailable: **zero** `data-testid` attributes exist anywhere in the app. |
| Forgot password | `getByText('Forgot your password?')` | It is a `<p>`, not a link or button. |
| User menu entries | `getByRole('menuitem', { name: 'Logout' })` | They are `<a href>` elements carrying an explicit `role="menuitem"`, which overrides the implicit link role. |
| User menu trigger | `.oxd-userdropdown-tab` (CSS) | A bare `<span>` with no role, no accessible name, no hook. The only documented CSS fallback in the suite. |
| Dropdown options | `getByRole('option', { name })` | The *trigger* is a role-less `<div>` and needs CSS, but the options are correctly marked up. |
| Native selects | — | There is not one `<select>` in the app; `selectOption()` cannot be used at all. |
| Column headers | `getByRole('columnheader', { name: /^Id/ })` | `exact: true` never matches (the name ends in a sort-icon glyph), and loose `'Id'` matches **two** headers — "Id" is a substring of "First (& M**id**dle) Name". |
| Row delete/edit | `button:has(i.bi-trash)` (CSS) | The row action buttons have no accessible name, no `title` and no `aria-label`. The icon class is the only thing telling delete from edit. |
| Directory heading | `getByRole('heading', { name: 'Directory', level: 5 })` | "Directory" is both the module name (`h6`) and the card title (`h5`); an unqualified locator matches both. |

### Behaviour

- **Module links all redirect.** No `viewXModule` URL is final: Admin lands on
  `/admin/viewSystemUsers`, PIM on `/pim/viewEmployeeList`, My Info on
  `/pim/viewPersonalDetails/empNumber/{id}`. Asserting the menu href always fails.
- **Two `h6` headings in the banner.** Modules with a secondary nav render module
  name *and* sub-page name, so the title locator is pinned with `.first()`.
- **Maintenance is gated.** It lands on an "Administrator Access" password
  interstitial with no side panel or banner. The suite asserts the gate and
  deliberately stops there — beyond it is the employee purge screen.
- **Results banner is inflected.** `(N) Records Found`, but `(1) Record Found`
  and `No Records Found`. Matching on the plural form alone misses two states.
- **The autocomplete emits a decoy.** A transient `Searching....` entry appears
  with `role="option"`. Taking `.first()` selects the placeholder and silently
  leaves the filter unset.
- **Login resumes the interrupted route.** After being bounced to login, signing
  in returns you to the originally requested page rather than the dashboard — so
  `auth.setup.ts` must start from a clean context.
- **The employee id field is length-validated.** An over-long value returns HTTP
  422 instead of an empty result set, so the "no records" fixture is short.
- **Waiting on the API response is not enough.** The grid repaints *after* the
  response resolves, so a filter assertion that reads the DOM immediately can
  observe the previous result set and pass or fail against stale rows. Filter
  assertions use auto-retrying `expect.poll` rather than one-shot reads.
- **Dropdowns list values nobody holds.** The directory's Job Title and Location
  filters offer every configured value, including ones with no employees —
  picking the first entry returns an empty directory. Journeys source filter
  values from records already on screen instead.
- **Maintenance re-authenticates.** It lands on an "Administrator Access"
  password interstitial with no side panel or banner.

## Test design under a shared, mutating database

This is a public sandbox that anyone can edit. The record count moved from **173
to 180 while these tests were being written**, and the admin profile name is
whatever the last visitor set it to.

It goes further than data: **the instance switched to Dutch mid-run** during
development — another visitor changed its localisation, and every English text
locator started timing out at once. `auth.setup.ts` now asserts the UI language
up front, so that failure mode reports itself in one line instead of as dozens of
unexplained timeouts.

Consequently no test asserts an exact record count, a specific employee, or the
profile name. Filters are verified for **internal consistency** instead: filter by
an employment status, then assert every returned row carries that status. That
holds regardless of what the data looks like today.

For the same reason the suite is **read-only by default** — a normal run creates,
edits and deletes nothing, and the purge screen is never entered. The write-path
specs that do mutate data are opt-in twice over: skipped unless
`E2E_ALLOW_WRITES=1`, and refused outright by CI when the target is the shared
demo. Point `BASE_URL` at your own instance to exercise them.

## Deliberate omissions

- **Mobile projects.** OrangeHRM collapses the side panel below ~1024px; the
  navigation specs assume a desktop layout and would fail there for layout
  reasons rather than real defects. Add them together with mobile-aware
  navigation helpers.
- **Password reset submission.** The flow is asserted as far as the reset page.
  Submitting it would disrupt the shared Admin account.
