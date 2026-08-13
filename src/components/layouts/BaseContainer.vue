<template>
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
                <v-img v-if="profilePhotoUrl" :src="profilePhotoUrl" cover />
                <span v-else class="text-h6">{{ authUser?.initials }}</span>
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
            >
              <template v-if="badgeFor(child)" #append>
                <span class="nav-count">{{ displayBadge(badgeFor(child)) }}</span>
              </template>
            </v-list-item>
          </v-list-group>

          <v-list-item
            v-else
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.routeName"
            @click="$router.push({ name: item.routeName })"
          >
            <template v-if="badgeFor(item)" #append>
              <span class="nav-count" :class="{ 'nav-count--message': item.routeName === 'messages' }">{{ displayBadge(badgeFor(item)) }}</span>
            </template>
          </v-list-item>
        </template>
      </v-list>

      <v-divider></v-divider>

      <template v-slot:append>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            value="logout"
            @click="requestLogout"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <div style="padding: 20px">
        <router-view v-if="authReady" />
        <v-skeleton-loader v-else type="article, table" />
      </div>
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "vuetify";
import { useAuth } from "@/composables/useAuth";
import { useAppSettings } from "@/composables/useAppSettings";
import { usePermissions } from "@/composables/usePermissions";
import { useProfilePhoto } from "@/composables/useProfilePhoto";
import { useAppDialog } from "@/composables/useAppDialog";
import axios from "@/plugins/axios";
import { getEcho } from "@/plugins/echo";
import {
  initializeNotificationSound,
  playMessageNotificationSound,
} from "@/utils/notificationSound";

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
  { title: "My Profile", icon: "mdi-account-circle-outline", routeName: "profile" },
  {
    title: "Messages",
    icon: "mdi-message-text-outline",
    routeName: "messages",
    // No permission slug here since every authenticated user can message
    // teammates. Add one (e.g. "view-messages") if you want to gate it.
  },
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
  },
  {
    title: "Workforce Calendar",
    icon: "mdi-calendar-star",
    routeName: "workforce-calendar",
    permission: "view-holidays",
  },
  {
    title: "Payroll",
    icon: "mdi-cash-multiple",
    routeName: "payroll-management",
  },
  {
    title: "Workplace Hub",
    icon: "mdi-office-building-marker-outline",
    routeName: "workplace-hub",
    permission: "view-workplace-hub",
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
    title: "Audit Logs",
    icon: "mdi-clipboard-text-clock-outline",
    routeName: "audit-log-management",
    permission: "view-audit-logs",
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
        title: "Job Grades",
        icon: "mdi-podium-gold",
        routeName: "job-grade-management",
        permission: "view-job-grades",
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
        routeName: "settings",
      },
      {
        title: "Employee Number Settings",
        icon: "mdi-badge-account-horizontal-outline",
        routeName: "employee-number-settings",
        permission: "manage-employee-number-settings",
      },
    ],
  },
];

const rail = ref(false);
const authReady = ref(false);
const route = useRoute();
const router = useRouter();

const navBadges = ref<Record<string, number>>({});
let badgeRefreshTimer: ReturnType<typeof setInterval> | undefined;
let notificationChannelName: string | null = null;
let badgeRequest: Promise<void> | null = null;
let lastBadgeLoadedAt = 0;

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const applyTheme = (themeName: string) => {
  theme.global.name.value = themeName;
  localStorage.setItem("APP_THEME", themeName);
};

const { loading, getUser, getSettings, authUser, logout } = useAuth();
const { confirm } = useAppDialog();
const requestLogout = async () => {
  const accepted = await confirm({
    title: "Log out?",
    message: "You will need to sign in again to access your workspace.",
    confirmText: "Log out",
    tone: "error",
  });
  if (accepted) await logout();
};
const { loadAppSettings, values: appSettings } = useAppSettings();
const { checkPermissions } = usePermissions();
const { photoUrl: profilePhotoUrl, loadProfilePhoto } = useProfilePhoto();

const badgeFor = (item: NavItem): number =>
  item.routeName ? Number(navBadges.value[item.routeName] || 0) : 0;

const displayBadge = (count: number): string => count > 99 ? "99+" : String(count);

const loadNavigationBadges = async (force = false) => {
  if (!force && Date.now() - lastBadgeLoadedAt < 15_000) return;
  if (badgeRequest) return badgeRequest;

  badgeRequest = (async () => {
    try {
      const response = await axios.get("/navigation/badges", {
        headers: { "X-Suppress-Success-Notification": "true" },
      });
      navBadges.value = response.data.data ?? {};
      lastBadgeLoadedAt = Date.now();
    } catch {
      // Navigation remains usable if background badge refresh fails.
    } finally {
      badgeRequest = null;
    }
  })();

  return badgeRequest;
};

const forceNavigationBadgeRefresh = () => void loadNavigationBadges(true);

const refreshBadgesWhenVisible = () => {
  if (document.visibilityState === "visible") void loadNavigationBadges();
};

const subscribeToMessageNotifications = async () => {
  if (!authUser.value?.id) return;
  const echo = await getEcho();
  if (!echo) return;

  notificationChannelName = `App.Models.User.${authUser.value.id}`;
  echo.private(notificationChannelName).listen(".message.sent", async (event: any) => {
    if (event.sender?.id === authUser.value?.id) return;
    await playMessageNotificationSound();
    await loadNavigationBadges(true);
  });
};

// Filters navItems down to what the current user can actually see.
// A group survives only if at least one of its children is visible.
const isVisible = (item: NavItem): boolean => {
  if (item.routeName === "payroll-management" && appSettings.value["payroll.enabled"] === false) {
    return false;
  }

  return !item.permission || checkPermissions(item.permission);
};

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
  initializeNotificationSound();
  await getUser();
  await loadProfilePhoto(authUser.value?.profile_photo_url);
  await loadNavigationBadges();
  await subscribeToMessageNotifications();
  badgeRefreshTimer = setInterval(loadNavigationBadges, 45000);
  window.addEventListener("navigation-badges:refresh", forceNavigationBadgeRefresh);
  document.addEventListener("visibilitychange", refreshBadgesWhenVisible);

  const requiredPermission = route.meta.permission as string | undefined;
  if (requiredPermission && !checkPermissions(requiredPermission)) {
    await router.replace({ name: "dashboard" });
  }

  try {
    const [savedSettings] = await Promise.all([
      getSettings(),
      loadAppSettings(),
    ]);
    const savedTheme =
      savedSettings?.theme || localStorage.getItem("APP_THEME") || "light";

    applyTheme(savedTheme);
  } finally {
    // Child routes must only render after personal and company settings have
    // been resolved; otherwise controls briefly display their fallback values.
    authReady.value = true;
  }
});

watch(
  () => route.fullPath,
  async () => {
    if (!authReady.value) return;
    const requiredPermission = route.meta.permission as string | undefined;
    if (requiredPermission && !checkPermissions(requiredPermission)) {
      await router.replace({ name: "dashboard" });
    }
    await loadNavigationBadges();
  },
);

onBeforeUnmount(() => {
  if (badgeRefreshTimer) clearInterval(badgeRefreshTimer);
  window.removeEventListener("navigation-badges:refresh", forceNavigationBadgeRefresh);
  document.removeEventListener("visibilitychange", refreshBadgesWhenVisible);
  if (notificationChannelName) {
    void getEcho().then((echo) => echo?.leave(notificationChannelName as string));
  }
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

.nav-count {
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  padding-inline: 5px;
  border-radius: 999px;
  color: rgb(var(--v-theme-on-warning));
  background: rgb(var(--v-theme-warning));
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
}

.nav-count--message {
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}
</style>
