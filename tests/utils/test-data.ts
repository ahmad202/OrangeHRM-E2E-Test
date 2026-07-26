/**
 * Central test data and routes.
 *
 * The demo credentials are published on the OrangeHRM login page itself, so they
 * are not a secret. They are still read from the environment first so the same
 * suite can point at a private instance via BASE_URL + ORANGEHRM_* vars.
 */
export const CREDENTIALS = {
  admin: {
    username: process.env.ORANGEHRM_USERNAME || 'Admin',
    password: process.env.ORANGEHRM_PASSWORD || 'admin123',
  },
  invalid: {
    username: 'Admin',
    password: 'definitely-not-the-password',
  },
} as const;

export const ROUTES = {
  login: '/web/index.php/auth/login',
  logout: '/web/index.php/auth/logout',
  resetPassword: '/web/index.php/auth/requestPasswordResetCode',
  dashboard: '/web/index.php/dashboard/index',
  employeeList: '/web/index.php/pim/viewEmployeeList',
  addEmployee: '/web/index.php/pim/addEmployee',
  myInfo: '/web/index.php/pim/viewMyDetails',
  directory: '/web/index.php/directory/viewDirectory',
  adminModule: '/web/index.php/admin/viewAdminModule',
  systemUsers: '/web/index.php/admin/viewSystemUsers',
  addSystemUser: '/web/index.php/admin/saveSystemUser',
  candidates: '/web/index.php/recruitment/viewCandidates',
  leaveModule: '/web/index.php/leave/viewLeaveModule',
  leaveList: '/web/index.php/leave/viewLeaveList',
} as const;

/** Storage state produced by `auth.setup.ts` and consumed by the authenticated fixture. */
export const AUTH_FILE = 'playwright/.auth/admin.json';

/**
 * Every module in the side panel, in the order OrangeHRM renders them.
 *
 * `landing` is where the browser actually ends up: none of the `viewXModule`
 * URLs are final — each one server-redirects to that module's default screen
 * (Admin lands on User Management, PIM on the employee list, and so on), so
 * asserting the href would always fail.
 *
 * `title` is the first `h6` in the banner after landing. It stays the module
 * name even when the URL belongs to a sub-page — note My Info lands inside PIM.
 */
export const SIDE_MENU_ITEMS = [
  { name: 'Admin', landing: /\/admin\/viewSystemUsers$/, title: 'Admin' },
  { name: 'PIM', landing: /\/pim\/viewEmployeeList$/, title: 'PIM' },
  { name: 'Leave', landing: /\/leave\/viewLeaveList$/, title: 'Leave' },
  { name: 'Time', landing: /\/time\/viewEmployeeTimesheet$/, title: 'Time' },
  { name: 'Recruitment', landing: /\/recruitment\/viewCandidates$/, title: 'Recruitment' },
  { name: 'My Info', landing: /\/pim\/viewPersonalDetails\/empNumber\/\d+$/, title: 'PIM' },
  { name: 'Performance', landing: /\/performance\/searchEvaluatePerformanceReview$/, title: 'Performance' },
  { name: 'Dashboard', landing: /\/dashboard\/index$/, title: 'Dashboard' },
  { name: 'Directory', landing: /\/directory\/viewDirectory$/, title: 'Directory' },
  // Maintenance is the odd one out: it lands on a credential re-validation
  // interstitial with no side panel and no banner, so it is asserted separately.
  { name: 'Maintenance', landing: /\/maintenance\/purgeEmployee$/, title: 'Maintenance', reauth: true },
  { name: 'Claim', landing: /\/claim\/viewAssignClaim$/, title: 'Claim' },
  { name: 'Buzz', landing: /\/buzz\/viewBuzz$/, title: 'Buzz' },
] as const;

/** Dashboard widget titles rendered for the Admin user. */
export const DASHBOARD_WIDGETS = [
  'Time at Work',
  'My Actions',
  'Quick Launch',
  'Buzz Latest Posts',
  'Employees on Leave Today',
  'Employee Distribution by Sub Unit',
  'Employee Distribution by Location',
] as const;

/** Column headers of the PIM employee list, in render order. */
export const EMPLOYEE_LIST_COLUMNS = [
  'Id',
  'First (& Middle) Name',
  'Last Name',
  'Job Title',
  'Employment Status',
  'Sub Unit',
  'Supervisor',
  'Actions',
] as const;

/**
 * Employment statuses offered by the PIM filter. These come from configuration
 * rather than employee records, so they are stable even as demo data churns.
 */
export const EMPLOYMENT_STATUSES = [
  'Freelance',
  'Full-Time Contract',
  'Full-Time Permanent',
  'Full-Time Probation',
  'Part-Time Contract',
  'Part-Time Internship',
  'Probation',
] as const;

/**
 * An employee id that matches nothing. Kept short on purpose: the employee id
 * field is length-validated server-side and an over-long value returns HTTP 422
 * instead of an empty result set.
 */
export const NONEXISTENT_EMPLOYEE_ID = '999999';

/**
 * Tabs on an employee record, mapped to the URL each one lands on.
 * `{n}` in the path is the employee number, which varies per record.
 */
export const EMPLOYEE_RECORD_TABS = {
  'Personal Details': /\/pim\/viewPersonalDetails\/empNumber\/\d+$/,
  'Contact Details': /\/pim\/contactDetails\/empNumber\/\d+$/,
  'Emergency Contacts': /\/pim\/viewEmergencyContacts\/empNumber\/\d+$/,
  Dependents: /\/pim\/viewDependents\/empNumber\/\d+$/,
  Immigration: /\/pim\/viewImmigration\/empNumber\/\d+$/,
  Job: /\/pim\/viewJobDetails\/empNumber\/\d+$/,
  Salary: /\/pim\/viewSalaryList\/empNumber\/\d+$/,
  'Report-to': /\/pim\/viewReportToDetails\/empNumber\/\d+$/,
  Qualifications: /\/pim\/viewQualifications\/empNumber\/\d+$/,
  Memberships: /\/pim\/viewMemberships\/empNumber\/\d+$/,
} as const;

export type EmployeeRecordTab = keyof typeof EMPLOYEE_RECORD_TABS;

/** User roles offered by the Admin > System Users filter. */
export const USER_ROLES = ['Admin', 'ESS'] as const;

/** Account statuses offered by the Admin > System Users filter. */
export const USER_STATUSES = ['Enabled', 'Disabled'] as const;

/** Candidate pipeline statuses offered by the Recruitment filter. */
export const CANDIDATE_STATUSES = [
  'Application Initiated',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Passed',
  'Interview Failed',
  'Job Offered',
  'Offer Declined',
  'Hired',
  'Rejected',
] as const;

/**
 * Write-path workflows are opt-in.
 *
 * The default target is a shared public demo; creating and deleting records on
 * every run would pollute a resource other people rely on. Set
 * `E2E_ALLOW_WRITES=1` (ideally with `BASE_URL` pointed at your own instance) to
 * enable them.
 */
export const WRITES_ENABLED = process.env.E2E_ALLOW_WRITES === '1';

/**
 * Builds a unique, obviously-synthetic identifier so anything a failed run
 * leaves behind is easy to spot and clean up by hand.
 */
export function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
