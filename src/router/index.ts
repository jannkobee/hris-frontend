import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/Login.vue"),
    meta: { requiresAuth: false },
  },

  // Authenticated Shell
  {
    path: "/",
    component: () => import("@/components/layouts/BaseContainer.vue"),
    meta: { requiresAuth: true },
    children: [
      // Default
      { path: "", redirect: { name: "dashboard" } },

      // Core
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("@/views/Modules/Dashboard.vue"),
      },
      {
        path: "messages",
        name: "messages",
        component: () => import("@/views/Modules/Messages/Messages.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/views/Modules/Profile/Profile.vue"),
      },

      // Management
      {
        path: "user-management",
        name: "user-management",
        meta: { permission: "view-users" },
        component: () =>
          import("@/views/Modules/UserManagement/UserManagement.vue"),
      },
      {
        path: "role-management",
        name: "role-management",
        meta: { permission: "view-roles" },
        component: () =>
          import("@/views/Modules/RoleManagement/RoleManagement.vue"),
      },
      {
        path: "employee-management",
        name: "employee-management",
        meta: { permission: "view-employees" },
        component: () =>
          import("@/views/Modules/EmployeeManagement/EmployeeManagement.vue"),
      },
      {
        path: "attendance-management",
        name: "attendance-management",
        component: () =>
          import("@/views/Modules/AttendanceManagement/AttendanceManagement.vue"),
      },
      {
        path: "payroll",
        name: "payroll-management",
        component: () => import("@/views/Modules/PayrollManagement/PayrollManagement.vue"),
      },
      {
        path: "leave-management",
        name: "leave-management",
        meta: { permission: "view-leave-requests" },
        component: () =>
          import("@/views/Modules/LeaveManagement/LeaveManagement.vue"),
      },
      {
        path: "overtime-management",
        name: "overtime-management",
        meta: { permission: "view-overtimes" },
        component: () =>
          import("@/views/Modules/OvertimeManagement/OvertimeManagement.vue"),
      },
      {
        path: "announcements",
        name: "announcement-management",
        meta: { permission: "view-announcements" },
        component: () =>
          import("@/views/Modules/AnnouncementManagement/AnnouncementManagement.vue"),
      },
      {
        path: "audit-logs",
        name: "audit-log-management",
        meta: { permission: "view-audit-logs" },
        component: () => import("@/views/Modules/AuditLog/AuditLog.vue"),
      },

      // ✅ SubModules (Configurations)
      {
        path: "configuration/employment-statuses",
        name: "employment-status-management",
        meta: { permission: "view-employment-statuses" },
        component: () =>
          import("@/views/Modules/SubModules/EmploymentStatusManagement/EmploymentStatusManagement.vue"),
      },
      {
        path: "configuration/positions",
        name: "position-management",
        meta: { permission: "view-positions" },
        component: () =>
          import("@/views/Modules/SubModules/PositionManagement/PositionManagement.vue"),
      },
      {
        path: "configuration/departments",
        name: "department-management",
        meta: { permission: "view-departments" },
        component: () =>
          import("@/views/Modules/SubModules/DepartmentManagement/DepartmentManagement.vue"),
      },
      {
        path: "configuration/job-grades",
        name: "job-grade-management",
        meta: { permission: "view-job-grades" },
        component: () =>
          import("@/views/Modules/SubModules/JobGradeManagement/JobGradeManagement.vue"),
      },
      {
        path: "configuration/employee-number-settings",
        name: "employee-number-settings",
        meta: { permission: "manage-employee-number-settings" },
        component: () =>
          import("@/views/Modules/SubModules/EmployeeNumberSettings/EmployeeNumberSettings.vue"),
      },
      {
        path: "configuration/settings",
        name: "settings",
        component: () => import("@/views/Modules/SubModules/Settings.vue"),
      },
      {
        path: "configuration/leave-types",
        name: "leave-type-management",
        meta: { permission: "view-leave-types" },
        component: () =>
          import("@/views/Modules/SubModules/LeaveTypeManagement/LeaveTypeManagement.vue"),
      },
      {
        path: "configuration/leave-credit-settings",
        name: "leave-credit-setting-management",
        meta: { permission: "view-leave-credit-settings" },
        component: () =>
          import("@/views/Modules/SubModules/LeaveCreditManagement/LeaveCreditManagement.vue"),
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

  if (requiresAuth && !isAuthenticated) {
    return next({ name: "login" });
  }

  if (to.name === "login" && isAuthenticated) {
    return next({ name: "dashboard" });
  }

  return next();
});

export default router;
