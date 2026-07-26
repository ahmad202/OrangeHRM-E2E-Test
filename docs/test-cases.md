# Test Cases — Journeys & Business Workflows

Test-case register for the OrangeHRM E2E suite. Each case maps to an automated
spec; the **Spec** column is the file that implements it.

**Legend** — `@journey` read-only business journey (runs by default) ·
`@workflow` write-path business process (opt-in) · `@smoke` critical path.

**Common precondition** for every case below: a valid OrangeHRM instance is
reachable at `BASE_URL`, and the Admin credentials in `tests/utils/test-data.ts`
are valid. Authenticated cases additionally reuse the session created by
`auth.setup.ts`.

---

## 1. Business journeys (read-only)

These exercise complete business processes without creating, editing or deleting
anything. All are automated and passing.

### J-01 — HR administrator audits an employee record

**Spec:** `tests/e2e/journeys/hr-record-audit.journey.spec.ts`
**Business need:** HR must be able to retrieve one employee's complete file.

| # | Step | Expected result |
|---|---|---|
| 1 | Open PIM > Employee List | Register loads with a populated grid |
| 2 | Type into Employee Name and pick a suggestion | Suggestion list appears; a real name is selectable |
| 3 | Search | Exactly the chosen employee is returned |
| 4 | Open the employee's record | Record opens on Personal Details with 10 section tabs |
| 5 | Visit each of the 10 tabs in turn | Every tab loads, and all stay on the **same** employee number |
| 6 | Reset the filter | Full register is restored |

**Why step 5 matters:** a tab that silently switched employee would make an audit
worthless. The employee number is re-read from the URL after every tab.

### J-02 — Employee reviews their own file (self-service)

**Spec:** `tests/e2e/journeys/employee-self-service.journey.spec.ts`
**Business need:** staff can read their own record, and only their own.

| # | Step | Expected result |
|---|---|---|
| 1 | Open My Info | Resolves to the signed-in user's own `empNumber` |
| 2 | Visit each of the 10 tabs | Every tab stays scoped to that same employee |
| 3 | Reach My Info from the side menu | Lands on the personal record; banner shows the **PIM** module |

**Why step 2 matters:** self-service leaking another employee's data is a privacy
defect, not just a navigation bug.

### J-03 — Recruiter reviews the hiring pipeline

**Spec:** `tests/e2e/journeys/recruiter-pipeline.journey.spec.ts`
**Business need:** candidates can be worked stage by stage.

| # | Step | Expected result |
|---|---|---|
| 1 | Open Recruitment > Candidates | Pipeline loads with Vacancy, Candidate, Hiring Manager, Date of Application and Status columns |
| 2 | Filter to **Shortlisted** | At least one candidate returned, and **every** row shows Shortlisted |
| 3 | Reset | Full pipeline restored, no smaller than the filtered set |
| 4 | Repeat for *Application Initiated*, *Interview Scheduled*, *Rejected* | No stage filter ever returns a candidate from another stage |

Step 4 tolerates an empty stage — which stages hold candidates changes constantly
on a shared instance — but never tolerates a leak.

### J-04 — Administrator audits who has access

**Spec:** `tests/e2e/journeys/user-access-audit.journey.spec.ts`
**Business need:** periodic access review; over-privileged or stale accounts must
be visible.

| # | Step | Expected result |
|---|---|---|
| 1 | Open Admin > System Users | Register loads with Username, User Role, Employee Name, Status |
| 2 | Filter by role **Admin**, then **ESS** | Only accounts of that role are listed |
| 3 | Filter by status **Enabled**, then **Disabled** | Only accounts of that status are listed |
| 4 | Search a username taken from the register | The matching account is returned |
| 5 | Reset | Full register restored |
| 6 | Search a username that does not exist | "No Records Found", zero rows |

Step 4 reads its search term off the register rather than hard-coding an account,
so the case survives demo data changing underneath it.

### J-05 — Employee looks a colleague up in the directory

**Spec:** `tests/e2e/journeys/directory-lookup.journey.spec.ts`
**Business need:** staff can find a colleague by role, office or name.

| # | Step | Expected result |
|---|---|---|
| 1 | Open Directory | Colleagues render as cards (not a grid) |
| 2 | Filter by a job title held by someone on screen | At least one card; **every** card shows that job title |
| 3 | Reset | Full directory restored |
| 4 | Filter by an office held by someone on screen | Every card shows that location |
| 5 | Search a colleague by name via autocomplete | The chosen colleague appears in the results |

Steps 2 and 4 source their value from a visible card. Picking the first dropdown
entry instead returns an empty directory, because the dropdowns list every
configured job title and location including ones nobody currently holds.

### J-06 — A full working session, sign-in to sign-out

**Spec:** `tests/e2e/journeys/full-session.journey.spec.ts` · also `@smoke`
**Business need:** the modules compose into a usable working session.

| # | Step | Expected result |
|---|---|---|
| 1 | Sign in | Dashboard loads |
| 2 | Check the dashboard | My Actions and Quick Launch are present |
| 3 | Go to PIM | Employee register loads with records |
| 4 | Go to Recruitment | Candidate pipeline loads with records |
| 5 | Go to Admin | System user register loads with records |
| 6 | Return to Dashboard | Dashboard loads; session has held throughout |
| 7 | Sign out | Returns to login |
| 8 | Request PIM directly while signed out | Redirected to login |

This case owns its session — it signs in through the UI rather than reusing the
shared stored state, because step 7 destroys the session server-side.

---

## 2. Business workflows (write path — opt-in)

> **Status: implemented but NOT verified end-to-end.**
> Selectors were read off the live application, but the create and delete steps
> were never executed against it — the default target is a shared public demo and
> writing to it pollutes a resource other people depend on. Run these against an
> instance you own before relying on them.
>
> Enable with `npm run test:workflows` (sets `E2E_ALLOW_WRITES=1`). Every case
> cleans up after itself in `afterEach`, so a mid-test failure leaves no orphan.

### W-01 — Hire a new starter

**Spec:** `tests/e2e/workflows/hire-employee.workflow.spec.ts`

| # | Step | Expected result |
|---|---|---|
| 1 | Open PIM > Add Employee | Form loads; an employee id is pre-generated |
| 2 | Enter first and last name | Accepted |
| 3 | Save | Employee is created; redirect to their new record |
| 4 | Check the record | 10 section tabs present, on the new employee's number |
| 5 | Search the register by the generated employee id | The new starter is listed with the entered names |
| 6 | *(cleanup)* Delete the employee | Record removed |

### W-02 — Reject an unnamed new starter

**Spec:** same file.

| # | Step | Expected result |
|---|---|---|
| 1 | Open Add Employee and save with empty fields | "Required" shown against the mandatory name fields; stays on the form |

### W-03 — Provision a system user

**Spec:** `tests/e2e/workflows/provision-user.workflow.spec.ts`

| # | Step | Expected result |
|---|---|---|
| 1 | Open Admin > Add User | Form loads |
| 2 | Choose role **ESS**, pick an employee from autocomplete, status **Enabled** | Accepted (free-text employee names are rejected by the form) |
| 3 | Set a unique username and matching passwords | Accepted |
| 4 | Save | Redirect back to the system user register |
| 5 | Search the new username | Exactly one account, with role ESS and status Enabled |
| 6 | *(cleanup)* Delete the account | Account removed |

### W-04 — Reject an incomplete account

**Spec:** same file.

| # | Step | Expected result |
|---|---|---|
| 1 | Open Add User and save with empty fields | Validation errors shown; stays on the form |

---

## 3. Functional coverage (supporting cases)

Screen-level cases that the journeys build on. All automated and passing — see
the specs for detail.

| Area | Spec | Covers |
|---|---|---|
| Login | `auth/login.spec.ts` | Valid sign-in, invalid password, unknown user, empty-field validation, password masking, forgot-password navigation, anonymous redirects from 3 protected routes |
| Logout | `auth/logout.spec.ts` | Sign-out returns to login; session invalidated server-side |
| Session | `auth/session.spec.ts` | Stored session reuse; account actions in the user menu |
| Dashboard | `dashboard/dashboard.spec.ts` | 7 widgets, 6 quick-launch shortcuts, all 12 modules listed, side-panel search, navigation into each module, Maintenance credential gate |
| Employee list | `pim/employee-list.spec.ts` | Grid columns, populated results, status filter, autocomplete filter, no-match handling, filter reset, pagination |

---

## 4. Out of scope, and why

| Not covered | Reason |
|---|---|
| Password reset submission | Would disrupt the shared Admin account; asserted only as far as the reset page |
| Maintenance / employee purge | Destructive; the credential gate is asserted and the flow stops there |
| Leave apply/approve, timesheet submit/approve, Buzz posts | Write-path processes on a shared instance; needs a private instance to automate responsibly |
| Mobile viewports | The side panel collapses below ~1024px; navigation cases assume desktop layout |
| Exact record counts, named employees | Demo data mutates continuously — counts moved 173 → 180 during authoring. Filters are asserted for internal consistency instead |
