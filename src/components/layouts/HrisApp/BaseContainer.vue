<template>
  <v-layout>
    <v-app-bar class="hris-topbar" elevation="0" height="56" density="compact">
      <v-btn
        class="topbar-nav-toggle"
        :icon="rail ? 'mdi-menu-open' : 'mdi-menu'"
        variant="text"
        size="small"
        :aria-label="rail ? 'Expand navigation' : 'Collapse navigation'"
        @click="toggleRail"
      />
      <v-spacer />

      <div class="topbar-actions">
        <v-menu
          location="bottom end"
          :close-on-content-click="false"
          max-width="420"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              class="notification-trigger topbar-icon-btn"
              variant="text"
              icon
              size="36"
              aria-label="Open notifications"
              @click="loadNotifications"
            >
              <v-icon icon="mdi-bell-outline" size="20" />
              <span v-if="notificationCount" class="notification-badge">{{
                displayBadge(notificationCount)
              }}</span>
            </v-btn>
          </template>
          <v-card class="notification-menu" min-width="360">
            <div class="notification-menu__header">
              <div>
                <div class="notification-menu__title">Notifications</div>
                <div class="notification-menu__subtitle">
                  {{
                    notificationCount
                      ? `${notificationCount} unread`
                      : "You're all caught up"
                  }}
                </div>
              </div>
              <v-btn
                size="small"
                variant="text"
                @click="router.push({ name: 'notifications' })"
                >View all</v-btn
              >
            </div>
            <v-divider />
            <v-list lines="two" max-height="420" class="overflow-y-auto py-0">
              <v-list-item
                v-for="notification in notifications"
                :key="notification.id"
                :class="{ 'notification-unread': !notification.read_at }"
                :title="notification.title"
                :subtitle="notification.body"
                @click="openNotification(notification)"
              >
                <template #prepend>
                  <v-avatar size="34" color="primary" variant="tonal">
                    <v-icon icon="mdi-bell-outline" size="18" />
                  </v-avatar>
                </template>
                <template v-if="!notification.read_at" #append>
                  <span class="notification-item__dot" aria-hidden="true" />
                </template>
              </v-list-item>
              <v-list-item
                v-if="!notifications.length"
                title="You are all caught up"
                subtitle="No notifications yet."
              >
                <template #prepend>
                  <v-avatar size="34" color="success" variant="tonal"
                    ><v-icon icon="mdi-check"
                  /></v-avatar>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>

        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              class="topbar-profile"
              variant="text"
              height="40"
              aria-label="Open account menu"
            >
              <v-avatar size="30" color="surface-variant"
                ><v-img
                  v-if="profilePhotoUrl"
                  :src="profilePhotoUrl"
                  cover
                /><span v-else>{{ authUser?.initials }}</span></v-avatar
              >
              <span class="topbar-profile__name">{{ displayName }}</span>
              <v-icon icon="mdi-chevron-down" size="16" />
            </v-btn>
          </template>
          <v-list class="account-menu" density="comfortable" min-width="240">
            <v-list-item :title="displayName" :subtitle="accountSubtitle">
              <template #prepend>
                <v-avatar size="34" color="primary" variant="tonal">{{
                  authUser?.initials
                }}</v-avatar>
              </template>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item
              prepend-icon="mdi-account-circle-outline"
              title="My Profile"
              @click="router.push({ name: 'profile' })"
            />
            <v-list-item
              prepend-icon="mdi-message-text-outline"
              title="Messages"
              @click="router.push({ name: 'messages' })"
            />
            <v-list-item
              v-if="checkPermissions('view-notes') && hasFeature('notes')"
              prepend-icon="mdi-note-edit-outline"
              title="My Notes"
              @click="router.push({ name: 'notes' })"
            />
            <v-divider class="my-1" />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Log out"
              @click="requestLogout"
            />
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      class="hris-drawer"
      :rail="rail"
      rail-width="64"
      width="264"
      permanent
    >
      <div class="sidebar-brand">
        <div class="sidebar-brand__mark">
          <v-icon icon="mdi-domain" size="20" />
        </div>
        <div v-if="!rail" class="sidebar-brand__copy">
          <strong>HRISFlow</strong
          ><span>{{
            authUser?.organization?.name || "Company workspace"
          }}</span>
        </div>
      </div>

      <v-list density="compact" nav v-model:opened="openGroups">
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
              :active="child.routeName === route.name"
              @click="
                $router.push({ name: child.routeName, query: child.routeQuery })
              "
            >
              <template v-if="badgeFor(child)" #append>
                <span class="nav-count">{{
                  displayBadge(badgeFor(child))
                }}</span>
              </template>
            </v-list-item>
          </v-list-group>

          <v-list-item
            v-else
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.routeName"
            :active="item.routeName === route.name"
            @click="
              $router.push({ name: item.routeName, query: item.routeQuery })
            "
          >
            <template v-if="badgeFor(item)" #append>
              <span
                class="nav-count"
                :class="{ 'nav-count--message': item.routeName === 'messages' }"
                >{{ displayBadge(badgeFor(item)) }}</span
              >
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <div class="hris-content">
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
import { usePlanEntitlements } from "@/composables/usePlanEntitlements";
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
  // Subscription feature required for this module. Role permissions are
  // evaluated separately and cannot unlock a feature the company has not bought.
  planFeature?: string;
  routeQuery?: Record<string, string>;
  children?: NavItem[];
};

// Single source of truth for the sidebar. Add/remove/reorder modules here —
// nothing else in this file needs to change to reflect it in the drawer.
const navItems: NavItem[] = [
  { title: "Dashboard", icon: "mdi-view-dashboard", routeName: "dashboard" },
  {
    title: "Approvals",
    icon: "mdi-clipboard-check-outline",
    routeName: "approval-inbox",
  },
  {
    title: "Employees",
    icon: "mdi-account-multiple-outline",
    routeName: "employee-management",
    permission: "view-employees",
  },
  {
    title: "Attendance",
    icon: "mdi-calendar-clock",
    routeName: "attendance-management",
  },
  {
    title: "Shifts & Roster",
    icon: "mdi-calendar-multiselect-outline",
    routeName: "shift-roster-management",
    permission: "view-shifts",
  },
  {
    title: "Leave",
    icon: "mdi-calendar-account",
    routeName: "leave-management",
    permission: "view-leave-requests",
  },
  {
    title: "Overtime",
    icon: "mdi-clock-plus-outline",
    routeName: "overtime-management",
    permission: "view-overtimes",
  },
  {
    title: "Workforce Calendar",
    icon: "mdi-calendar-star",
    routeName: "workforce-calendar",
    permission: "view-holidays",
  },
  {
    title: "Announcements",
    icon: "mdi-bullhorn-outline",
    routeName: "announcement-management",
    permission: "view-announcements",
  },
  {
    title: "Workplace Hub",
    icon: "mdi-office-building-marker-outline",
    routeName: "workplace-hub",
    permission: "view-workplace-hub",
    planFeature: "workplace_hub",
  },
  {
    title: "Payroll",
    icon: "mdi-cash-multiple",
    routeName: "payroll-management",
    planFeature: "payroll",
  },
  {
    title: "Benefits & Expenses",
    icon: "mdi-heart-plus-outline",
    routeName: "benefits-expenses",
  },
  {
    title: "Reports",
    icon: "mdi-chart-box-outline",
    routeName: "reports",
    permission: "view-reports",
  },
  {
    title: "Configurations",
    icon: "mdi-tune-variant",
    children: [
      {
        title: "Departments",
        icon: "mdi-domain",
        routeName: "department-management",
        permission: "view-departments",
      },
      {
        title: "Positions",
        icon: "mdi-briefcase-outline",
        routeName: "position-management",
        permission: "view-positions",
      },
      {
        title: "Employment Statuses",
        icon: "mdi-list-status",
        routeName: "employment-status-management",
        permission: "view-employment-statuses",
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
        title: "Overtime Policies",
        icon: "mdi-clock-plus-outline",
        routeName: "overtime-policy-management",
        permission: "manage-overtimes",
      },
      {
        title: "Employee Number Settings",
        icon: "mdi-badge-account-horizontal-outline",
        routeName: "employee-number-settings",
        permission: "manage-employee-number-settings",
      },
    ],
  },
  {
    title: "Administration",
    icon: "mdi-shield-crown-outline",
    children: [
      {
        title: "Users",
        icon: "mdi-account-cog-outline",
        routeName: "user-management",
        permission: "view-users",
      },
      {
        title: "Roles",
        icon: "mdi-head-cog-outline",
        routeName: "role-management",
        permission: "view-roles",
      },
      {
        title: "App Settings",
        icon: "mdi-cog-box",
        routeName: "settings",
      },
      {
        title: "Billing & Subscription",
        icon: "mdi-credit-card-outline",
        routeName: "billing",
        permission: "manage-organization-settings",
      },
      {
        title: "Audit Logs",
        icon: "mdi-clipboard-text-clock-outline",
        routeName: "audit-log-management",
        permission: "view-audit-logs",
        planFeature: "audit_logs",
      },
      {
        title: "Meeting Rooms",
        icon: "mdi-door-open",
        routeName: "workplace-hub",
        routeQuery: { tab: "rooms" },
        permission: "manage-meeting-rooms",
        planFeature: "workplace_hub",
      },
    ],
  },
];

const rail = ref(localStorage.getItem("HRIS_NAV_RAIL") === "true");
const authReady = ref(false);
const route = useRoute();
const router = useRouter();
const toggleRail = () => {
  rail.value = !rail.value;
  localStorage.setItem("HRIS_NAV_RAIL", String(rail.value));
};

// Keeps whichever config/admin group holds the active route expanded, without
// collapsing a group the user opened manually elsewhere in the sidebar.
const openGroups = ref<string[]>(
  navItems
    .filter((item) =>
      item.children?.some((child) => child.routeName === route.name),
    )
    .map((item) => item.title),
);

watch(
  () => route.name,
  () => {
    const activeGroup = navItems.find((item) =>
      item.children?.some((child) => child.routeName === route.name),
    );
    if (activeGroup && !openGroups.value.includes(activeGroup.title)) {
      openGroups.value.push(activeGroup.title);
    }
  },
);

const navBadges = ref<Record<string, number>>({});
const notifications = ref<any[]>([]);
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
const displayName = computed(() =>
  [
    authUser.value?.first_name,
    authUser.value?.middle_name,
    authUser.value?.last_name,
  ]
    .filter(Boolean)
    .join(" "),
);
const accountSubtitle = computed(() =>
  [
    authUser.value?.email,
    authUser.value?.organization
      ? `${authUser.value.organization.name} · ${authUser.value.organization.plan?.name ?? authUser.value.organization.plan_code}`
      : null,
  ]
    .filter(Boolean)
    .join(" — "),
);
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
const { hasFeature } = usePlanEntitlements();
const { photoUrl: profilePhotoUrl, loadProfilePhoto } = useProfilePhoto();

const badgeFor = (item: NavItem): number =>
  item.routeName ? Number(navBadges.value[item.routeName] || 0) : 0;
const notificationCount = computed(() =>
  Number(navBadges.value.notifications || 0),
);
const loadNotifications = async () => {
  const response = await axios.get("/notifications", {
    params: { limit: 8 },
    headers: { "X-Suppress-Success-Notification": "true" },
  });
  notifications.value = response.data.data?.data ?? [];
};
const openNotification = async (notification: any) => {
  if (!notification.read_at)
    await axios.patch(`/notifications/${notification.id}/read`);
  await loadNavigationBadges(true);
  if (notification.type?.includes("attendance_correction"))
    await router.push({ name: "attendance-management" });
};

const displayBadge = (count: number): string =>
  count > 99 ? "99+" : String(count);

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
  echo
    .private(notificationChannelName)
    .listen(".message.sent", async (event: any) => {
      if (event.sender?.id === authUser.value?.id) return;
      await playMessageNotificationSound();
      await loadNavigationBadges(true);
    });
};

// Filters navItems down to what the current user can actually see.
// A group survives only if at least one of its children is visible.
const isVisible = (item: NavItem): boolean => {
  if (item.planFeature && !hasFeature(item.planFeature)) {
    return false;
  }

  if (
    item.routeName === "payroll-management" &&
    appSettings.value["payroll.enabled"] === false
  ) {
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
  await loadNotifications();
  await subscribeToMessageNotifications();
  badgeRefreshTimer = setInterval(loadNavigationBadges, 45000);
  window.addEventListener(
    "navigation-badges:refresh",
    forceNavigationBadgeRefresh,
  );
  document.addEventListener("visibilitychange", refreshBadgesWhenVisible);

  const requiredPermission = route.meta.permission as string | undefined;
  const requiredPlanFeature = route.meta.planFeature as string | undefined;
  if (
    (requiredPermission && !checkPermissions(requiredPermission)) ||
    (requiredPlanFeature && !hasFeature(requiredPlanFeature))
  ) {
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
    const requiredPlanFeature = route.meta.planFeature as string | undefined;
    if (
      (requiredPermission && !checkPermissions(requiredPermission)) ||
      (requiredPlanFeature && !hasFeature(requiredPlanFeature))
    ) {
      await router.replace({ name: "dashboard" });
    }
    await loadNavigationBadges();
  },
);

onBeforeUnmount(() => {
  if (badgeRefreshTimer) clearInterval(badgeRefreshTimer);
  window.removeEventListener(
    "navigation-badges:refresh",
    forceNavigationBadgeRefresh,
  );
  document.removeEventListener("visibilitychange", refreshBadgesWhenVisible);
  if (notificationChannelName) {
    void getEcho().then((echo) =>
      echo?.leave(notificationChannelName as string),
    );
  }
});
</script>

<style lang="css" scoped>
:deep(.v-list-group__items) {
  padding-left: 0 !important;
}

:deep(.v-list-group--sub .v-list-item) {
  padding-inline-start: 34px !important;
}

:deep(.v-list-item--nav) {
  padding-inline-start: 14px !important;
  border-radius: 8px;
}

.nav-count {
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  padding-inline: 6px;
  border-radius: 999px;
  color: rgb(var(--v-theme-on-warning));
  background: rgb(var(--v-theme-warning));
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.nav-count--message {
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.notification-unread {
  background: rgba(var(--v-theme-primary), 0.06);
}

.notification-item__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
}

.notification-menu {
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18) !important;
}

.notification-menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.notification-menu__title {
  font-size: 0.92rem;
  font-weight: 700;
}

.notification-menu__subtitle {
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.74rem;
}

.hris-content {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  margin: 0;
  padding: 24px;
}

.hris-topbar {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface)) !important;
}

.topbar-nav-toggle {
  margin-inline: 4px 8px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-inline-end: 4px;
}

.topbar-icon-btn {
  position: relative;
  width: 36px !important;
  height: 36px !important;
  margin: 0 !important;
}

/* Overrides the old fixed-position placement: the trigger now lives inside
   the app-bar's normal flex flow, so it stays put regardless of drawer state. */
.notification-trigger {
  position: static;
  z-index: auto;
  border-left: none;
}

.notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  min-width: 16px;
  height: 16px;
  place-items: center;
  padding-inline: 3px;
  border-radius: 999px;
  color: rgb(var(--v-theme-on-error));
  background: rgb(var(--v-theme-error));
  font-size: 0.58rem;
  font-weight: 700;
}

.sidebar-brand {
  display: flex;
  min-height: 60px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-brand__mark {
  display: grid;
  min-width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 9px;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.sidebar-brand__copy {
  display: grid;
  min-width: 0;
  flex: 1;
  line-height: 1.3;
}

.sidebar-brand__copy strong,
.sidebar-brand__copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-brand__copy strong {
  color: var(--sidebar-fg-strong);
  font-size: 0.86rem;
  font-weight: 700;
}

.sidebar-brand__copy span {
  color: var(--sidebar-fg);
  font-size: 0.71rem;
}

.topbar-profile {
  display: flex;
  align-items: center;
  gap: 15px;
  width: auto;
  max-width: 180px;
  margin: 0;
  padding: 3px 8px 3px 4px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.topbar-profile__name {
  padding-left: 7px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 0.76rem;
  font-weight: 650;
}

.account-menu {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
}

/* A persistent ink rail gives the console a stable identity that doesn't
   shift with the light/dark toggle, which only affects the content area. */
.hris-drawer {
  --sidebar-fg: rgba(255, 255, 255, 0.64);
  --sidebar-fg-strong: rgba(255, 255, 255, 0.95);
  background: #1c1c1e !important;
}

.hris-drawer :deep(.v-navigation-drawer__content) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hris-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar) {
  display: none;
}

.hris-drawer :deep(.v-list-item-title) {
  font-size: 0.82rem;
  font-weight: 550;
  letter-spacing: 0.01em;
}

.hris-drawer :deep(.v-list-item),
.hris-drawer :deep(.v-icon) {
  color: var(--sidebar-fg);
}

.hris-drawer :deep(.v-list-item:hover) {
  background: rgba(255, 255, 255, 0.06);
}

.hris-drawer :deep(.v-list-item--active)::before {
  opacity: 0;
}

.hris-drawer :deep(.v-list-item--active) {
  background: rgba(255, 255, 255, 0.1);
}

.hris-drawer :deep(.v-list-item--active .v-list-item-title),
.hris-drawer :deep(.v-list-item--active .v-icon) {
  color: var(--sidebar-fg-strong);
}

.hris-drawer :deep(.v-list-item--nav.v-list-item--active) {
  position: relative;
}

.hris-drawer :deep(.v-list-item--nav.v-list-item--active)::after {
  content: "";
  position: absolute;
  inset-block: 6px;
  inset-inline-start: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: rgb(var(--v-theme-primary));
}

/* BaseContainer owns the application gutter. Root module containers should
   not add Vuetify's default 16px padding on top of it. */
.hris-content > :deep(.v-container) {
  padding: 0 !important;
}

@media (max-width: 960px) {
  .hris-content {
    padding: 68px 12px 24px;
  }
}

@media (max-width: 600px) {
  .hris-content {
    padding: 68px 16px 24px;
  }

  .topbar-profile {
    max-width: 40px;
    padding: 4px;
  }
  .topbar-profile__name,
  .topbar-profile > .v-icon {
    display: none;
  }
}
</style>
