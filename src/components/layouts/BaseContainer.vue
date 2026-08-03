<template>
  <v-dialog v-model="showConfirm" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Confirm Logout</v-card-title>
      <v-card-text>Do you really want to log out of your account?</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" @click="showConfirm = false">Cancel</v-btn>
        <v-btn prepend-icon="mdi-logout" color="red" @click="logout">
          Logout
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-layout>
    <v-navigation-drawer :rail="rail" permanent @click="rail = false">
      <v-list>
        <v-skeleton-loader :loading="loading" type="avatar, list-item-two-line">
          <v-list-item
            prepend-avatar="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
            :title="`
              ${authUser?.first_name}
              ${authUser?.middle_name ? ' ' + authUser?.middle_name : ''}
              ${authUser?.last_name ? ' ' + authUser?.last_name : ''}
            `"
            :subtitle="authUser?.email"
          >
            <template #prepend>
              <v-avatar color="surface-variant" class="text-on-surface">
                <span class="text-h6">{{ authUser?.initials }}</span>
              </v-avatar>
            </template>
            <template #append>
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                @click.stop="rail = !rail"
              />
            </template>
          </v-list-item>
        </v-skeleton-loader>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <template v-for="item in visibleNavItems" :key="item.title">
          <v-list-group v-if="item.children" :value="item.title">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.icon"
                :title="item.title"
              />
            </template>

            <v-list-item
              v-for="child in item.children"
              :key="child.routeName"
              :prepend-icon="child.icon"
              :title="child.title"
              :value="child.routeName"
              @click="$router.push({ name: child.routeName })"
            />
          </v-list-group>

          <v-list-item
            v-else
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.routeName"
            @click="$router.push({ name: item.routeName })"
          />
        </template>
      </v-list>

      <v-divider></v-divider>

      <template v-slot:append>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            value="logout"
            @click="showConfirm = true"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <div style="padding: 20px">
        <router-view />
      </div>
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import { useTheme } from "vuetify";
import { useAuth } from "@/composables/useAuth";

type NavItem = {
  title: string;
  icon: string;
  // Route name to navigate to. Omit for group headers that only contain children.
  routeName?: string;
  // Permission slug required to show this item. Omit to always show it.
  permission?: string;
  children?: NavItem[];
};

// Single source of truth for the sidebar. Add/remove/reorder modules here —
// nothing else in this file needs to change to reflect it in the drawer.
const navItems: NavItem[] = [
  { title: "Dashboard", icon: "mdi-view-dashboard", routeName: "dashboard" },
  {
    title: "User Management",
    icon: "mdi-account-cog-outline",
    routeName: "user-management",
    permission: "view-users",
  },
  {
    title: "Role Management",
    icon: "mdi-head-cog-outline",
    routeName: "role-management",
    permission: "view-roles",
  },
  {
    title: "Employee Management",
    icon: "mdi-account-group-outline",
    routeName: "employee-management",
    permission: "view-employees",
  },
  {
    title: "Attendance Management",
    icon: "mdi-calendar-clock",
    routeName: "attendance-management",
    permission: "view-attendances",
  },
  {
    title: "Leave Management",
    icon: "mdi-calendar-account",
    routeName: "leave-management",
    permission: "view-leave-requests",
  },
  {
    title: "Overtime Management",
    icon: "mdi-clock-plus-outline",
    routeName: "overtime-management",
    permission: "view-overtimes",
  },
  {
    title: "Announcements",
    icon: "mdi-bullhorn-outline",
    routeName: "announcement-management",
    permission: "view-announcements",
  },
  {
    title: "Configurations",
    icon: "mdi-cog-outline",
    children: [
      {
        title: "Employment Statuses",
        icon: "mdi-list-status",
        routeName: "employment-status-management",
        permission: "view-employment-statuses",
      },
      {
        title: "Positions",
        icon: "mdi-briefcase-outline",
        routeName: "position-management",
        permission: "view-positions",
      },
      {
        title: "Departments",
        icon: "mdi-domain",
        routeName: "department-management",
        permission: "view-departments",
      },
      {
        title: "Leave Types",
        icon: "mdi-calendar-badge",
        routeName: "leave-type-management",
        permission: "view-leave-types",
      },
      {
        title: "Leave Credit Settings",
        icon: "mdi-calendar-plus",
        routeName: "leave-credit-setting-management",
        permission: "view-leave-credit-settings",
      },
      {
        title: "App Settings",
        icon: "mdi-cog-box",
        routeName: "theme-settings",
      },
      {
        title: "Employee Number Settings",
        icon: "mdi-badge-account-horizontal-outline",
        routeName: "employee-number-settings",
        permission: "view-employee-number-settings",
      },
    ],
  },
];

const rail = ref(false);

const showConfirm = ref(false);

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const applyTheme = (themeName: string) => {
  theme.global.name.value = themeName;
  localStorage.setItem("APP_THEME", themeName);
};

const { loading, getUser, getSettings, authUser, logout } = useAuth();

const checkPermissions = (permission: string): boolean => {
  if (!authUser.value?.role?.permissions) {
    return false;
  }

  return authUser.value.role.permissions.some(
    (perm: { slug: string }) => perm.slug === permission,
  );
};

// Filters navItems down to what the current user can actually see.
// A group survives only if at least one of its children is visible.
const isVisible = (item: NavItem): boolean =>
  !item.permission || checkPermissions(item.permission);

const visibleNavItems = computed<NavItem[]>(() =>
  navItems.reduce<NavItem[]>((acc, item) => {
    if (item.children) {
      const children = item.children.filter(isVisible);
      if (children.length) acc.push({ ...item, children });
    } else if (isVisible(item)) {
      acc.push(item);
    }

    return acc;
  }, []),
);

onMounted(async () => {
  await getUser();

  const savedSettings = await getSettings();
  const savedTheme =
    savedSettings?.theme || localStorage.getItem("APP_THEME") || "light";

  applyTheme(savedTheme);
});
</script>

<style lang="css" scoped>
:deep(.v-list-group__items) {
  padding-left: 0 !important;
}

:deep(.v-list-group--sub .v-list-item) {
  padding-inline-start: 12px !important;
}

:deep(.v-list-item--nav) {
  padding-inline-start: 12px !important;
}
</style>
