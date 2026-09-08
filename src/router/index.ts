import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/Marketing/Home.vue"),
    meta: {
      requiresAuth: false,
      title: "LexisOne — Simple HR for Growing Teams",
    },
  },
  {
    path: "/saas",
    name: "saas-showcase",
    redirect: (to) => ({ name: "home", query: to.query, hash: to.hash }),
  },
  {
    path: "/start-trial",
    name: "start-trial",
    component: () => import("@/views/StartTrial.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/Login.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("@/views/ForgotPassword.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: () => import("@/views/ResetPassword.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/accept-invite",
    name: "accept-organization-invite",
    component: () => import("@/views/AcceptOrganizationInvite.vue"),
    meta: { requiresAuth: false },
  },
  { path: "/platform", redirect: { name: "platform-console-login" } },
  {
    path: "/platform/login",
    name: "platform-console-login",
    component: () => import("@/views/PlatformConsole/Login.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/platform-console",
    component: () =>
      import("@/components/layouts/PlatformConsole/PlatformConsoleLayout.vue"),
    meta: { requiresAuth: false, requiresPlatformAuth: true },
    children: [
      { path: "", redirect: { name: "platform-overview" } },
      {
        path: "pricing",
        name: "platform-pricing",
        component: () => import("@/views/PlatformConsole/Pricing.vue"),
        meta: { platformTitle: "Pricing" },
      },
      {
        path: "overview",
        name: "platform-overview",
        component: () => import("@/views/PlatformConsole/Overview.vue"),
        meta: { platformTitle: "Overview" },
      },
      {
        path: "organizations",
        alias: "/platform/organizations",
        name: "platform-organizations",
        component: () => import("@/views/PlatformConsole/Organizations.vue"),
        meta: { platformTitle: "Organizations" },
      },
      {
        path: "organizations/new",
        alias: "/platform/onboarding",
        name: "platform-organization-onboarding",
        component: () =>
          import("@/views/PlatformConsole/OrganizationOnboarding.vue"),
        meta: { platformTitle: "Create organization" },
      },
      {
        path: "organizations/:id",
        alias: "/platform/organizations/:id",
        name: "platform-organization-detail",
        component: () =>
          import("@/views/PlatformConsole/OrganizationDetail.vue"),
        meta: { platformTitle: "Organization details" },
      },
    ],
  },

  // Authenticated Shell
  {
    path: "/app",
    component: () => import("@/components/layouts/HrisApp/BaseContainer.vue"),
    meta: { requiresAuth: true },
    children: [
      // Default
      { path: "", redirect: { name: "dashboard" } },

      // Core
      {
        path: "/dashboard",
        name: "dashboard",
        component: () => import("@/views/HrisApp/Modules/Dashboard.vue"),
      },
      {
        path: "/messages",
        name: "messages",
        component: () =>
          import("@/views/HrisApp/Modules/Messages/Messages.vue"),
      },
      {
        path: "/notifications",
        name: "notifications",
        component: () => import("@/views/HrisApp/Modules/Notifications.vue"),
      },
      {
        path: "/approvals",
        name: "approval-inbox",
        component: () => import("@/views/HrisApp/Modules/ApprovalInbox.vue"),
      },
      {
        path: "/notes",
        name: "notes",
        meta: { permission: "view-notes", planFeature: "notes" },
        component: () => import("@/views/HrisApp/Modules/Notes/Notes.vue"),
      },
      {
        path: "/profile",
        name: "profile",
        component: () => import("@/views/HrisApp/Modules/Profile/Profile.vue"),
      },

      // Administration
      {
        path: "/administration/users",
        alias: ["/user-management", "/administration/user-management"],
        name: "user-management",
        meta: { permission: "view-users" },
        component: () =>
          import("@/views/HrisApp/Modules/UserManagement/UserManagement.vue"),
      },
      {
        path: "/administration/roles",
        alias: ["/role-management", "/administration/role-management"],
        name: "role-management",
        meta: { permission: "view-roles" },
        component: () =>
          import("@/views/HrisApp/Modules/RoleManagement/RoleManagement.vue"),
      },
      {
        path: "/employees",
        alias: "/employee-management",
        name: "employee-management",
        meta: { permission: "view-employees" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/EmployeeManagement/EmployeeManagement.vue"
          ),
      },
      {
        path: "/attendance",
        alias: "/attendance-management",
        name: "attendance-management",
        component: () =>
          import(
            "@/views/HrisApp/Modules/AttendanceManagement/AttendanceManagement.vue"
          ),
      },
      {
        path: "/attendance-corrections",
        name: "attendance-corrections",
        component: () =>
          import("@/views/HrisApp/Modules/AttendanceCorrections.vue"),
      },
      {
        path: "/shifts",
        name: "shift-roster-management",
        meta: { permission: "view-shifts" },
        component: () =>
          import("@/views/HrisApp/Modules/ShiftRosterManagement.vue"),
      },
      {
        path: "/workforce-calendar",
        name: "workforce-calendar",
        meta: { permission: "view-holidays" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/WorkforceCalendar/WorkforceCalendar.vue"
          ),
      },
      {
        path: "/payroll",
        name: "payroll-management",
        meta: { planFeature: "payroll" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/PayrollManagement/PayrollManagement.vue"
          ),
      },
      {
        path: "/benefits-expenses",
        name: "benefits-expenses",
        component: () => import("@/views/HrisApp/Modules/BenefitsExpenses.vue"),
      },
      {
        path: "/reports",
        name: "reports",
        meta: { permission: "view-reports" },
        component: () => import("@/views/HrisApp/Modules/Reports.vue"),
      },
      {
        path: "/workplace-hub",
        name: "workplace-hub",
        meta: {
          permission: "view-workplace-hub",
          planFeature: "workplace_hub",
        },
        component: () =>
          import("@/views/HrisApp/Modules/WorkplaceHub/WorkplaceHub.vue"),
      },
      {
        path: "/leave",
        alias: "/leave-management",
        name: "leave-management",
        meta: { permission: "view-leave-requests" },
        component: () =>
          import("@/views/HrisApp/Modules/LeaveManagement/LeaveManagement.vue"),
      },
      {
        path: "/overtime",
        alias: "/overtime-management",
        name: "overtime-management",
        meta: { permission: "view-overtimes" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/OvertimeManagement/OvertimeManagement.vue"
          ),
      },
      {
        path: "/announcements",
        name: "announcement-management",
        meta: { permission: "view-announcements" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/AnnouncementManagement/AnnouncementManagement.vue"
          ),
      },
      {
        path: "/administration/audit-logs",
        alias: "/audit-logs",
        name: "audit-log-management",
        meta: { permission: "view-audit-logs", planFeature: "audit_logs" },
        component: () =>
          import("@/views/HrisApp/Modules/AuditLog/AuditLog.vue"),
      },

      // Configuration modules
      {
        path: "/configuration/employment-statuses",
        name: "employment-status-management",
        meta: { permission: "view-employment-statuses" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/EmploymentStatusManagement/EmploymentStatusManagement.vue"
          ),
      },
      {
        path: "/configuration/positions",
        name: "position-management",
        meta: { permission: "view-positions" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/PositionManagement/PositionManagement.vue"
          ),
      },
      {
        path: "/configuration/departments",
        name: "department-management",
        meta: { permission: "view-departments" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/DepartmentManagement/DepartmentManagement.vue"
          ),
      },
      {
        path: "/configuration/job-grades",
        name: "job-grade-management",
        meta: { permission: "view-job-grades" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/JobGradeManagement/JobGradeManagement.vue"
          ),
      },
      {
        path: "/configuration/employee-number-settings",
        name: "employee-number-settings",
        meta: { permission: "manage-employee-number-settings" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/EmployeeNumberSettings/EmployeeNumberSettings.vue"
          ),
      },
      {
        path: "/administration/settings",
        alias: "/configuration/settings",
        name: "settings",
        component: () => import("@/views/HrisApp/Modules/Settings.vue"),
      },
      {
        path: "/administration/billing",
        name: "billing",
        meta: { permission: "manage-organization-settings" },
        component: () => import("@/views/HrisApp/Modules/Billing.vue"),
      },
      {
        path: "/configuration/leave-types",
        name: "leave-type-management",
        meta: { permission: "view-leave-types" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/LeaveTypeManagement/LeaveTypeManagement.vue"
          ),
      },
      {
        path: "/configuration/leave-credit-settings",
        name: "leave-credit-setting-management",
        meta: { permission: "view-leave-credit-settings" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/LeaveCreditManagement/LeaveCreditManagement.vue"
          ),
      },
      {
        path: "/configuration/overtime-policies",
        name: "overtime-policy-management",
        meta: { permission: "manage-overtimes" },
        component: () =>
          import(
            "@/views/HrisApp/Modules/OvertimePolicyManagement/OvertimePolicyManagement.vue"
          ),
      },
    ],
  },

  // Errors
  {
    path: "/page-not-found",
    name: "page-not-found",
    component: () => import("@/views/PageNotFound.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "page-not-found" },
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, _from, next) => {
  const isAuthenticated = !!window.localStorage.getItem("APP_TOKEN");
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
  const requiresPlatformAuth = to.matched.some(
    (record) => record.meta?.requiresPlatformAuth,
  );

  if (
    requiresPlatformAuth &&
    !window.sessionStorage.getItem("HRIS_PLATFORM_SESSION_KEY")
  ) {
    return next({
      name: "platform-console-login",
      query: { redirect: to.fullPath },
    });
  }

  if (
    to.name === "platform-console-login" &&
    window.sessionStorage.getItem("HRIS_PLATFORM_SESSION_KEY")
  ) {
    return next({ name: "platform-overview" });
  }

  if (requiresAuth && !isAuthenticated) {
    return next({ name: "login" });
  }

  if (to.name === "login" && isAuthenticated) {
    return next({ name: "dashboard" });
  }

  return next();
});

const titleCase = (value: string): string =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

router.afterEach((to) => {
  const pageTitle = to.meta.title
    ? String(to.meta.title)
    : titleCase(String(to.name || "LexisOne"));
  document.title = pageTitle === "LexisOne" ? pageTitle : `${pageTitle}`;
});

export default router;
