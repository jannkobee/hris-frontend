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

      // Management
      {
        path: "user-management",
        name: "user-management",
        component: () =>
          import("@/views/Modules/UserManagement/UserManagement.vue"),
      },
      {
        path: "role-management",
        name: "role-management",
        component: () =>
          import("@/views/Modules/RoleManagement/RoleManagement.vue"),
      },
      {
        path: "employee-management",
        name: "employee-management",
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
        path: "leave-management",
        name: "leave-management",
        component: () =>
          import("@/views/Modules/LeaveManagement/LeaveManagement.vue"),
      },

      // ✅ SubModules (Configurations)
      {
        path: "configuration/employment-statuses",
        name: "employment-status-management",
        component: () =>
          import("@/views/Modules/SubModules/EmploymentStatusManagement/EmploymentStatusManagement.vue"),
      },
      {
        path: "configuration/positions",
        name: "position-management",
        component: () =>
          import("@/views/Modules/SubModules/PositionManagement/PositionManagement.vue"),
      },
      {
        path: "configuration/departments",
        name: "department-management",
        component: () =>
          import("@/views/Modules/SubModules/DepartmentManagement/DepartmentManagement.vue"),
      },
      {
        path: "configuration/employee-number-settings",
        name: "employee-number-settings",
        component: () =>
          import("@/views/Modules/SubModules/EmployeeNumberSettings/EmployeeNumberSettings.vue"),
      },
      {
        path: "configuration/leave-types",
        name: "leave-type-management",
        component: () =>
          import("@/views/Modules/SubModules/LeaveTypeManagement/LeaveTypeManagement.vue"),
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
