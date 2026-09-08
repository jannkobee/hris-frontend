<template>
  <v-app class="platform-shell">
    <!-- Mobile Scrim Overlay -->
    <div
      v-if="mobileOpen"
      class="sidebar-scrim"
      aria-hidden="true"
      @click="mobileOpen = false"
    />

    <!-- Sidebar Navigation Drawer -->
    <aside
      class="platform-sidebar"
      :class="{
        'is-open': mobileOpen,
        'is-rail': isRail,
      }"
      role="navigation"
      aria-label="Platform Console Navigation"
    >
      <!-- Brand & Header -->
      <div class="platform-brand">
        <RouterLink :to="{ name: 'platform-overview' }" class="brand-link">
          <div class="brand-mark-wrapper">
            <div
              class="brand-mark"
              :style="{ backgroundImage: `url(${appIcon})` }"
              role="img"
              aria-label="LexisOne"
            />
          </div>
          <div v-show="!isRail" class="brand-text">
            <div class="brand-name-row">
              <strong class="brand-title">Lexis<span>One</span></strong>
              <span class="control-tag">OPS</span>
            </div>
            <span class="brand-subtitle">Platform Control Plane</span>
          </div>
        </RouterLink>

        <!-- Desktop Rail Toggle (shown when not rail) -->
        <button
          v-if="!isRail"
          type="button"
          class="rail-toggle desktop-only"
          :title="isRail ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-label="isRail ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleRail"
        >
          <v-icon icon="mdi-chevron-left" size="18" />
        </button>

        <!-- Mobile Close Button -->
        <button
          type="button"
          class="mobile-close"
          aria-label="Close navigation"
          @click="mobileOpen = false"
        >
          <v-icon icon="mdi-close" size="20" />
        </button>
      </div>

      <!-- Quick Action: Expand if in Rail Mode -->
      <div v-if="isRail" class="rail-expand-row desktop-only">
        <button
          type="button"
          class="rail-expand-btn"
          title="Expand sidebar (Ctrl+B)"
          aria-label="Expand sidebar"
          @click="toggleRail"
        >
          <v-icon icon="mdi-chevron-right" size="18" />
        </button>
      </div>

      <!-- Navigation Links by Section -->
      <div class="sidebar-nav-scroll">
        <template v-for="section in navSections" :key="section.title">
          <div v-if="!isRail" class="nav-section-title">
            {{ section.title }}
          </div>
          <div v-else class="nav-section-divider" />

          <nav class="nav-group">
            <RouterLink
              v-for="item in section.items"
              :key="item.name"
              :to="{ name: item.name }"
              class="nav-item"
              :class="{ active: isActive(item.name) }"
              @click="mobileOpen = false"
            >
              <div class="nav-icon-box">
                <v-icon :icon="item.icon" size="20" />
              </div>

              <div v-show="!isRail" class="nav-item-content">
                <span class="nav-item-label">{{ item.label }}</span>
                <small v-if="item.description" class="nav-item-desc">{{
                  item.description
                }}</small>
              </div>

              <span
                v-if="!isRail && item.badge"
                class="nav-item-badge"
                :class="item.badgeColor"
              >
                {{ item.badge }}
              </span>

              <!-- Tooltip in Rail mode -->
              <v-tooltip
                v-if="isRail"
                activator="parent"
                location="right"
                offset="10"
              >
                <div>
                  <div class="font-weight-bold">{{ item.label }}</div>
                  <div v-if="item.description" class="text-caption text-grey">
                    {{ item.description }}
                  </div>
                </div>
              </v-tooltip>
            </RouterLink>
          </nav>
        </template>
      </div>

      <!-- System Health / Status Card -->
      <div v-if="!isRail" class="system-status-card">
        <div class="status-indicator">
          <span class="status-dot-pulse" />
          <span class="status-dot" />
        </div>
        <div class="status-details">
          <div class="status-heading">
            <strong>Platform Core</strong>
            <span class="status-badge">Operational</span>
          </div>
          <small class="status-meta">API Gateway connected</small>
        </div>
      </div>
      <div v-else class="rail-status-pill">
        <div class="status-indicator">
          <span class="status-dot-pulse" />
          <span class="status-dot" />
        </div>
        <v-tooltip activator="parent" location="right" offset="10">
          Platform API: Operational & Connected
        </v-tooltip>
      </div>

      <!-- Sidebar Footer (Staff Profile & Session) -->
      <div class="sidebar-footer" :class="{ 'is-rail': isRail }">
        <div v-if="!isRail" class="operator-strip">
          <div class="operator-avatar">
            <v-icon icon="mdi-shield-account-outline" size="18" />
          </div>
          <div class="operator-info">
            <span class="operator-role">Staff Operator</span>
            <span class="operator-key" :title="platformSessionKey">
              {{ maskedKey }}
            </span>
          </div>
          <button
            type="button"
            class="action-icon-btn"
            :title="copyTooltip"
            :aria-label="copyTooltip"
            @click="copySessionKey"
          >
            <v-icon
              :icon="copiedKey ? 'mdi-check' : 'mdi-content-copy'"
              size="15"
              :color="copiedKey ? 'success' : undefined"
            />
          </button>
        </div>

        <div class="footer-links">
          <RouterLink
            to="/"
            class="footer-btn"
            :class="{ 'rail-icon-only': isRail }"
            title="Public Website"
          >
            <v-icon icon="mdi-open-in-new" size="17" />
            <span v-show="!isRail">Public website</span>
            <v-tooltip
              v-if="isRail"
              activator="parent"
              location="right"
              offset="10"
            >
              Public website
            </v-tooltip>
          </RouterLink>

          <button
            type="button"
            class="footer-btn logout-btn"
            :class="{ 'rail-icon-only': isRail }"
            title="End staff session"
            @click="logout"
          >
            <v-icon icon="mdi-logout" size="17" />
            <span v-show="!isRail">Sign out</span>
            <v-tooltip
              v-if="isRail"
              activator="parent"
              location="right"
              offset="10"
            >
              Sign out of staff session
            </v-tooltip>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Application Shell -->
    <div
      class="platform-main"
      :class="{
        'is-rail': isRail,
      }"
    >
      <!-- Modern Sticky Topbar -->
      <header class="platform-topbar" role="banner">
        <div class="topbar-left">
          <!-- Mobile Menu Hamburger -->
          <v-btn
            class="mobile-menu-btn"
            icon="mdi-menu"
            size="small"
            variant="text"
            aria-label="Open sidebar"
            @click="mobileOpen = true"
          />

          <!-- Desktop Rail Toggle (visible on topbar) -->
          <v-btn
            class="topbar-rail-toggle desktop-only"
            :icon="isRail ? 'mdi-dock-left' : 'mdi-dock-window'"
            size="small"
            variant="text"
            :title="
              isRail ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'
            "
            :aria-label="isRail ? 'Expand sidebar' : 'Collapse sidebar'"
            @click="toggleRail"
          />

          <!-- Breadcrumbs & Context Title -->
          <nav class="topbar-breadcrumbs" aria-label="Breadcrumb navigation">
            <ol class="breadcrumb-list">
              <li
                v-for="(crumb, index) in breadcrumbs"
                :key="crumb.label"
                class="breadcrumb-item"
                :class="{ 'is-last': index === breadcrumbs.length - 1 }"
              >
                <RouterLink
                  v-if="index < breadcrumbs.length - 1"
                  :to="crumb.to"
                  class="breadcrumb-link"
                >
                  <v-icon
                    v-if="crumb.icon"
                    :icon="crumb.icon"
                    size="15"
                    class="crumb-icon"
                  />
                  <span>{{ crumb.label }}</span>
                </RouterLink>
                <span v-else class="breadcrumb-current">
                  <v-icon
                    v-if="crumb.icon"
                    :icon="crumb.icon"
                    size="15"
                    class="crumb-icon"
                  />
                  <strong>{{ crumb.label }}</strong>
                </span>

                <v-icon
                  v-if="index < breadcrumbs.length - 1"
                  icon="mdi-chevron-right"
                  size="14"
                  class="crumb-separator"
                />
              </li>
            </ol>
          </nav>
        </div>

        <!-- Topbar Right Actions -->
        <div class="topbar-right">
          <!-- Quick Jump / Command Palette Search Button -->
          <button
            type="button"
            class="quick-search-trigger"
            title="Quick navigator (Ctrl+K)"
            @click="searchDialogOpen = true"
          >
            <v-icon icon="mdi-magnify" size="16" />
            <span class="search-label">Quick jump...</span>
            <kbd class="shortcut-badge">⌘K</kbd>
          </button>

          <!-- Quick "New Organization" action button -->
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-plus"
            class="create-org-quick-btn"
            :to="{ name: 'platform-organization-onboarding' }"
          >
            New Org
          </v-btn>

          <!-- Status Indicator Pill -->
          <div class="live-status-pill desktop-only">
            <span class="live-dot" />
            <span>Staff Session</span>
          </div>

          <!-- Staff Profile Dropdown Menu -->
          <v-menu location="bottom end" offset="8">
            <template #activator="{ props }">
              <button
                v-bind="props"
                type="button"
                class="staff-profile-trigger"
                aria-label="Staff account menu"
              >
                <v-avatar class="staff-avatar" size="34">
                  <v-icon icon="mdi-account-tie" size="19" />
                </v-avatar>
                <div class="staff-profile-meta desktop-only">
                  <span class="staff-name">Staff Admin</span>
                  <span class="staff-role">Platform Operator</span>
                </div>
                <v-icon
                  icon="mdi-chevron-down"
                  size="15"
                  class="desktop-only"
                />
              </button>
            </template>

            <v-card class="staff-menu-card" min-width="260" elevation="12">
              <div class="staff-menu-header">
                <v-avatar size="40" class="menu-avatar">
                  <v-icon icon="mdi-shield-check" size="22" color="#c99a4b" />
                </v-avatar>
                <div>
                  <div class="menu-user-title">Staff Administrator</div>
                  <div class="menu-user-sub">Internal Control Plane</div>
                </div>
              </div>

              <v-divider class="my-1" />

              <div class="staff-menu-section">
                <div class="key-preview-box">
                  <div class="key-preview-header">
                    <span>Active Session Key</span>
                    <button
                      type="button"
                      class="mini-copy-btn"
                      @click="copySessionKey"
                    >
                      <v-icon
                        :icon="copiedKey ? 'mdi-check' : 'mdi-content-copy'"
                        size="13"
                      />
                      <span>{{ copiedKey ? "Copied" : "Copy" }}</span>
                    </button>
                  </div>
                  <code>{{ maskedKey }}</code>
                </div>
              </div>

              <v-divider class="my-1" />

              <v-list density="compact" class="py-1">
                <v-list-item
                  prepend-icon="mdi-view-dashboard-outline"
                  title="Overview Dashboard"
                  :to="{ name: 'platform-overview' }"
                />
                <v-list-item
                  prepend-icon="mdi-domain"
                  title="Organizations Directory"
                  :to="{ name: 'platform-organizations' }"
                />
                <v-list-item
                  prepend-icon="mdi-plus-box-outline"
                  title="Provision New Tenant"
                  :to="{ name: 'platform-organization-onboarding' }"
                />
                <v-list-item
                  prepend-icon="mdi-cash-multiple"
                  title="Pricing Configuration"
                  :to="{ name: 'platform-pricing' }"
                />
                <v-divider class="my-1" />
                <v-list-item
                  prepend-icon="mdi-open-in-new"
                  title="Public Application"
                  to="/"
                />
                <v-list-item
                  prepend-icon="mdi-logout"
                  title="End Staff Session"
                  class="text-error"
                  @click="logout"
                />
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </header>

      <!-- Router Content View Area -->
      <main class="platform-content">
        <RouterView />
      </main>
    </div>

    <!-- Quick Navigation Command Palette Dialog -->
    <v-dialog
      v-model="searchDialogOpen"
      max-width="560"
      class="quick-jump-dialog"
    >
      <v-card class="palette-card">
        <div class="palette-input-box">
          <v-icon icon="mdi-magnify" size="20" class="palette-search-icon" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="palette-input"
            placeholder="Type a command or jump to a page..."
            @keydown.down.prevent="navigatePalette(1)"
            @keydown.up.prevent="navigatePalette(-1)"
            @keydown.enter.prevent="selectPaletteItem"
          />
          <kbd class="palette-esc-badge" @click="searchDialogOpen = false"
            >ESC</kbd
          >
        </div>

        <v-divider />

        <div class="palette-results">
          <div v-if="filteredCommands.length === 0" class="palette-empty">
            <v-icon icon="mdi-magnify-close" size="28" />
            <p>No matching console views found</p>
          </div>

          <div
            v-for="(cmd, idx) in filteredCommands"
            :key="cmd.id"
            class="palette-item"
            :class="{ 'is-selected': idx === selectedPaletteIndex }"
            @click="executeCommand(cmd)"
            @mouseenter="selectedPaletteIndex = idx"
          >
            <div class="palette-item-icon">
              <v-icon :icon="cmd.icon" size="18" />
            </div>
            <div class="palette-item-info">
              <span class="palette-item-title">{{ cmd.title }}</span>
              <small class="palette-item-sub">{{ cmd.category }}</small>
            </div>
            <v-icon
              icon="mdi-arrow-right"
              size="16"
              class="palette-item-arrow"
            />
          </div>
        </div>

        <div class="palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to select</span>
          <span><kbd>ESC</kbd> to close</span>
        </div>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import type { RouteLocationRaw } from "vue-router";
import { useTheme } from "vuetify";
import {
  clearPlatformSession,
  platformKey,
} from "@/composables/PlatformConsole/usePlatformAuth";
import appIcon from "@/assets/lexisone-logo.png";

interface NavItem {
  name: string;
  label: string;
  icon: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface BreadcrumbItem {
  label: string;
  to: RouteLocationRaw;
  icon?: string;
}

const route = useRoute();
const router = useRouter();
const theme = useTheme();

// Responsive & Sidebar state
const mobileOpen = ref(false);
const isRail = ref(
  window.localStorage.getItem("HRIS_PLATFORM_SIDEBAR_RAIL") === "true",
);

const toggleRail = () => {
  isRail.value = !isRail.value;
  window.localStorage.setItem(
    "HRIS_PLATFORM_SIDEBAR_RAIL",
    String(isRail.value),
  );
};

// Theme retention
const previousTheme = theme.global.name.value;

// Navigation hierarchy & grouping
const navSections: NavSection[] = [
  {
    title: "Command Center",
    items: [
      {
        name: "platform-overview",
        label: "Overview",
        icon: "mdi-view-dashboard-outline",
        description: "Health & control plane metrics",
        badge: "Live",
        badgeColor: "badge-green",
      },
    ],
  },
  {
    title: "Directory & Tenants",
    items: [
      {
        name: "platform-organizations",
        label: "Organizations",
        icon: "mdi-domain",
        description: "Customer accounts & subscriptions",
      },
      {
        name: "platform-organization-onboarding",
        label: "Create Organization",
        icon: "mdi-plus-box-outline",
        description: "Provision tenant & initial admin",
      },
    ],
  },
  {
    title: "Billing & Configuration",
    items: [
      {
        name: "platform-pricing",
        label: "Pricing Settings",
        icon: "mdi-cash-multiple",
        description: "Growth rates & allowances",
      },
    ],
  },
];

const title = computed(() =>
  String(route.meta.platformTitle ?? "Platform Console"),
);

const isActive = (name: string) => {
  if (name === "platform-organizations") {
    return ["platform-organizations", "platform-organization-detail"].includes(
      String(route.name),
    );
  }
  return route.name === name;
};

// Breadcrumb generator
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const current = String(route.name);
  const crumbs: BreadcrumbItem[] = [
    {
      label: "Platform",
      to: { name: "platform-overview" },
      icon: "mdi-shield-crown-outline",
    },
  ];

  if (current === "platform-overview") {
    crumbs.push({
      label: "Overview",
      to: { name: "platform-overview" },
      icon: "mdi-view-dashboard-outline",
    });
  } else if (current === "platform-organizations") {
    crumbs.push({
      label: "Organizations",
      to: { name: "platform-organizations" },
      icon: "mdi-domain",
    });
  } else if (current === "platform-organization-detail") {
    crumbs.push({
      label: "Organizations",
      to: { name: "platform-organizations" },
      icon: "mdi-domain",
    });
    const orgId = route.params.id ? String(route.params.id) : "Details";
    crumbs.push({
      label: orgId.length > 20 ? `${orgId.slice(0, 18)}…` : orgId,
      to: { name: "platform-organization-detail", params: route.params },
      icon: "mdi-office-building-cog-outline",
    });
  } else if (current === "platform-organization-onboarding") {
    crumbs.push({
      label: "Organizations",
      to: { name: "platform-organizations" },
      icon: "mdi-domain",
    });
    crumbs.push({
      label: "Create Organization",
      to: { name: "platform-organization-onboarding" },
      icon: "mdi-plus-box-outline",
    });
  } else if (current === "platform-pricing") {
    crumbs.push({
      label: "Pricing Settings",
      to: { name: "platform-pricing" },
      icon: "mdi-cash-multiple",
    });
  } else {
    crumbs.push({
      label: title.value,
      to: { name: current },
      icon: "mdi-chevron-right",
    });
  }
  return crumbs;
});

// Session Key Details
const platformSessionKey = computed(() => platformKey());
const maskedKey = computed(() => {
  const key = platformSessionKey.value;
  if (!key) return "No active session";
  if (key.length <= 8) return `••••${key}`;
  return `••••${key.slice(-4)}`;
});

const copiedKey = ref(false);
const copyTooltip = computed(() =>
  copiedKey.value ? "Key copied!" : "Copy session key",
);

const copySessionKey = async () => {
  const key = platformSessionKey.value;
  if (!key) return;
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(key);
      copiedKey.value = true;
      setTimeout(() => {
        copiedKey.value = false;
      }, 2000);
    }
  } catch {
    // fallback
  }
};

const logout = () => {
  clearPlatformSession();
  router.push({ name: "platform-console-login" });
};

// Command Palette & Quick Jump Dialog
const searchDialogOpen = ref(false);
const searchQuery = ref("");
const selectedPaletteIndex = ref(0);
const searchInputRef = ref<HTMLInputElement | null>(null);

const commandList = [
  {
    id: "overview",
    title: "Platform Overview",
    category: "Command Center",
    icon: "mdi-view-dashboard-outline",
    routeName: "platform-overview",
  },
  {
    id: "organizations",
    title: "Organizations Directory",
    category: "Tenant Management",
    icon: "mdi-domain",
    routeName: "platform-organizations",
  },
  {
    id: "create-org",
    title: "Create / Provision Organization",
    category: "Tenant Management",
    icon: "mdi-plus-box-outline",
    routeName: "platform-organization-onboarding",
  },
  {
    id: "pricing",
    title: "Pricing & Billing Settings",
    category: "Billing Configuration",
    icon: "mdi-cash-multiple",
    routeName: "platform-pricing",
  },
  {
    id: "public-site",
    title: "Exit to Public Website",
    category: "Navigation",
    icon: "mdi-open-in-new",
    routeName: "",
    to: "/",
  },
];

const filteredCommands = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return commandList;
  return commandList.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q),
  );
});

watch(searchDialogOpen, (isOpen) => {
  if (isOpen) {
    searchQuery.value = "";
    selectedPaletteIndex.value = 0;
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
});

const navigatePalette = (step: number) => {
  const max = filteredCommands.value.length;
  if (max === 0) return;
  selectedPaletteIndex.value = (selectedPaletteIndex.value + step + max) % max;
};

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  routeName?: string;
  to?: string;
}

const executeCommand = (cmd: CommandItem) => {
  searchDialogOpen.value = false;
  if (cmd.to) {
    router.push(cmd.to);
  } else if (cmd.routeName) {
    router.push({ name: cmd.routeName });
  }
};

const selectPaletteItem = () => {
  const cmd = filteredCommands.value[selectedPaletteIndex.value];
  if (cmd) {
    executeCommand(cmd);
  }
};

// Global keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchDialogOpen.value = !searchDialogOpen.value;
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
    e.preventDefault();
    toggleRail();
  }
  if (e.key === "Escape") {
    if (searchDialogOpen.value) searchDialogOpen.value = false;
    if (mobileOpen.value) mobileOpen.value = false;
  }
};

onMounted(() => {
  theme.global.name.value = "dark";
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  theme.global.name.value = previousTheme;
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.platform-shell {
  --ink: #0a0c10;
  --panel: #11141c;
  --panel-raised: #161b26;
  --panel-hover: #1c2230;
  --line: #222938;
  --line-soft: rgba(255, 255, 255, 0.05);
  --line-focus: rgba(201, 154, 75, 0.4);
  --text: #f0f2f7;
  --text-muted: #8c96a8;
  --text-faint: #576173;
  --accent: #c99a4b;
  --accent-soft: rgba(201, 154, 75, 0.12);
  --accent-strong: #e5b35a;
  --signal: #10b981;
  --signal-soft: rgba(16, 185, 129, 0.16);

  min-height: 100vh;
  background-color: var(--ink);
  background-image: radial-gradient(
    circle at 50% 0%,
    rgba(27, 34, 48, 0.45) 0%,
    transparent 65%
  );
  color: var(--text);
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

/* ==========================================================================
   Sidebar Styles
   ========================================================================== */
.platform-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 268px;
  display: flex;
  flex-direction: column;
  padding: 18px 14px 14px;
  background: linear-gradient(180deg, var(--panel) 0%, var(--ink) 100%);
  color: var(--text);
  z-index: 40;
  border-right: 1px solid var(--line);
  box-shadow: 8px 0 28px rgba(0, 0, 0, 0.28);
  transition:
    width 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.platform-sidebar.is-rail {
  width: 72px;
  padding: 18px 10px 14px;
}

/* Brand Section */
.platform-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 16px;
  border-bottom: 1px solid var(--line-soft);
  min-height: 52px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
}

.brand-mark-wrapper {
  flex-shrink: 0;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background-color: #1a1e28;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 78%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.24);
  transition: transform 0.2s ease;
}

.brand-link:hover .brand-mark {
  transform: scale(1.04);
}

.brand-text {
  display: flex;
  flex-direction: column;
  white-space: nowrap;
  overflow: hidden;
}

.brand-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-title {
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
}

.brand-title span {
  color: var(--accent);
}

.control-tag {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  border: 1px solid rgba(201, 154, 75, 0.25);
}

.brand-subtitle {
  font-size: 0.68rem;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.rail-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-faint);
  cursor: pointer;
  transition: all 0.16s ease;
}

.rail-toggle:hover {
  background: var(--line-soft);
  color: var(--text);
  border-color: var(--line);
}

.rail-expand-row {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.rail-expand-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--line-soft);
  border: 1px solid var(--line);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.16s ease;
}

.rail-expand-btn:hover {
  background: var(--panel-hover);
  color: var(--text);
}

/* Nav Scroll & Items */
.sidebar-nav-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 0 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nav-section-title {
  padding: 0 10px 4px;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

.nav-section-divider {
  height: 1px;
  background: var(--line-soft);
  margin: 4px 8px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 500;
  transition: all 0.18s ease;
}

.platform-sidebar.is-rail .nav-item {
  justify-content: center;
  padding: 10px;
}

.nav-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  transition: transform 0.18s ease;
}

.nav-item-content {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
}

.nav-item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.nav-item-desc {
  font-size: 0.68rem;
  color: var(--text-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.nav-item-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  letter-spacing: 0.02em;
}

.badge-green {
  background: var(--signal-soft);
  color: var(--signal);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.nav-item:hover {
  color: var(--text);
  background: var(--line-soft);
}

.nav-item:hover .nav-icon-box {
  transform: translateX(1px);
}

.nav-item.active {
  color: #fff;
  background: var(--panel-raised);
  box-shadow: inset 0 0 0 1px var(--line);
}

.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: var(--accent);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(201, 154, 75, 0.6);
}

.nav-item.active .nav-icon-box {
  color: var(--accent-strong);
}

/* System Status Indicator */
.system-status-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-top: auto;
  border-radius: 8px;
  background: rgba(22, 27, 38, 0.7);
  border: 1px solid var(--line);
}

.status-indicator {
  position: relative;
  width: 10px;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--signal);
}

.status-dot-pulse {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: var(--signal);
  opacity: 0.5;
  animation: pulse-ring 2.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  70% {
    transform: scale(2.2);
    opacity: 0;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.status-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.status-heading {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-heading strong {
  font-size: 0.75rem;
  color: var(--text);
}

.status-badge {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--signal);
  letter-spacing: 0.02em;
}

.status-meta {
  font-size: 0.66rem;
  color: var(--text-faint);
}

.rail-status-pill {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  margin-top: auto;
  border-radius: 8px;
  background: var(--panel-raised);
  border: 1px solid var(--line);
}

/* Sidebar Footer & Operator Info */
.sidebar-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-footer.is-rail {
  padding-top: 8px;
}

.operator-strip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--line-soft);
}

.operator-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  border: 1px solid rgba(201, 154, 75, 0.2);
  flex-shrink: 0;
}

.operator-info {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
}

.operator-role {
  font-size: 0.73rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
}

.operator-key {
  font-family: monospace;
  font-size: 0.66rem;
  color: var(--text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.16s ease;
}

.action-icon-btn:hover {
  background: var(--line-soft);
  color: var(--text);
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.16s ease;
}

.footer-btn:hover {
  background: var(--line-soft);
  color: var(--text);
}

.footer-btn.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.footer-btn.rail-icon-only {
  justify-content: center;
  padding: 10px;
}

/* ==========================================================================
   Main Shell & Topbar
   ========================================================================== */
.platform-main {
  min-height: 100vh;
  margin-left: 268px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.platform-main.is-rail {
  margin-left: 72px;
}

.platform-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: rgba(10, 12, 16, 0.84);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Breadcrumbs */
.topbar-breadcrumbs {
  display: flex;
  align-items: center;
  min-width: 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 6px;
  font-size: 0.82rem;
  overflow: hidden;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.16s ease;
}

.breadcrumb-link:hover {
  color: var(--text);
}

.breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text);
}

.breadcrumb-current strong {
  font-weight: 600;
}

.crumb-icon {
  color: var(--accent);
}

.crumb-separator {
  color: var(--text-faint);
}

/* Quick Search Trigger */
.quick-search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--panel-raised);
  border: 1px solid var(--line);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.16s ease;
}

.quick-search-trigger:hover {
  background: var(--panel-hover);
  border-color: rgba(255, 255, 255, 0.14);
  color: var(--text);
}

.search-label {
  font-size: 0.77rem;
}

.shortcut-badge {
  font-family: inherit;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-muted);
}

/* Live Status Pill */
.live-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 12px;
  background: var(--accent-soft);
  border: 1px solid rgba(201, 154, 75, 0.25);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--accent-strong);
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-strong);
}

/* Staff Profile Button */
.staff-profile-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 8px 3px 3px;
  border-radius: 20px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text);
  cursor: pointer;
  transition: all 0.16s ease;
}

.staff-profile-trigger:hover {
  background: var(--line-soft);
  border-color: var(--line);
}

.staff-avatar {
  background: var(--panel-raised) !important;
  border: 1px solid var(--line);
}

.staff-profile-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.1;
}

.staff-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text);
}

.staff-role {
  font-size: 0.65rem;
  color: var(--text-muted);
}

/* Staff Menu Card */
.staff-menu-card {
  background: var(--panel-raised) !important;
  border: 1px solid var(--line) !important;
  color: var(--text) !important;
  border-radius: 10px !important;
  border-radius: 0 !important;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4) !important;
}

.staff-menu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.menu-avatar {
  background: var(--accent-soft) !important;
  border: 1px solid rgba(201, 154, 75, 0.25);
}

.menu-user-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
}

.menu-user-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.staff-menu-section {
  padding: 10px 14px;
}

.key-preview-box {
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px 10px;
}

.key-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 0.68rem;
  color: var(--text-faint);
  font-weight: 600;
}

.mini-copy-btn {
  display: inline-flex;
  align-items: border;
  gap: 4px;
  background: transparent;
  border: 0;
  color: var(--accent);
  font-size: 0.65rem;
  cursor: pointer;
}

.mini-copy-btn:hover {
  text-decoration: underline;
}

.key-preview-box code {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--accent-strong);
}

/* Content Area */
.platform-content {
  flex: 1 1 auto;
  min-height: calc(100vh - 60px);
}

/* ==========================================================================
   Command Palette Dialog
   ========================================================================== */
.palette-card {
  background: var(--panel-raised) !important;
  border: 1px solid var(--line) !important;
  color: var(--text) !important;
  border-radius: 12px !important;
  border-radius: 0 !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6) !important;
  overflow: hidden;
}

.palette-input-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
}

.palette-search-icon {
  color: var(--text-muted);
}

.palette-input {
  flex: 1 1 auto;
  background: transparent;
  border: 0;
  outline: none;
  font-size: 0.95rem;
  color: #fff;
}

.palette-input::placeholder {
  color: var(--text-faint);
}

.palette-esc-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-faint);
  cursor: pointer;
}

.palette-results {
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
}

.palette-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--text-faint);
  gap: 8px;
}

.palette-empty p {
  margin: 0;
  font-size: 0.84rem;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.14s ease;
}

.palette-item.is-selected {
  background: var(--panel-hover);
}

.palette-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--line-soft);
  color: var(--accent);
}

.palette-item.is-selected .palette-item-icon {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.palette-item-info {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.palette-item-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text);
}

.palette-item-sub {
  font-size: 0.68rem;
  color: var(--text-faint);
}

.palette-item-arrow {
  color: var(--text-faint);
  opacity: 0;
  transition: opacity 0.14s ease;
}

.palette-item.is-selected .palette-item-arrow {
  opacity: 1;
  color: var(--accent);
}

.palette-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 10px 18px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--line);
  font-size: 0.7rem;
  color: var(--text-faint);
}

.palette-footer kbd {
  font-family: inherit;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  margin-right: 2px;
}

/* ==========================================================================
   Responsive Breakpoints
   ========================================================================== */
.mobile-menu-btn,
.mobile-close {
  display: none;
}

.sidebar-scrim {
  display: none;
}

@media (min-width: 821px) {
  .mobile-menu-btn {
    display: none !important;
  }
}

@media (max-width: 820px) {
  .platform-sidebar {
    width: 268px !important;
    transform: translateX(-105%);
  }

  .platform-sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 35;
  }

  .platform-main {
    margin-left: 0 !important;
  }

  .mobile-menu-btn {
    display: inline-flex;
  }

  .mobile-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: transparent;
    border: 0;
    color: var(--text-muted);
    cursor: pointer;
  }

  .desktop-only {
    display: none !important;
  }

  .platform-topbar {
    padding: 0 16px;
  }

  .search-label {
    display: none;
  }

  .quick-search-trigger {
    padding: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .platform-sidebar,
  .platform-main,
  .nav-item,
  .status-dot-pulse {
    transition: none !important;
    animation: none !important;
  }
}
</style>

<!-- Global overrides for child views inside Platform Console -->
<style>
/* Modern Sleek Scrollbar */
.platform-shell ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.platform-shell ::-webkit-scrollbar-track {
  background: transparent;
}
.platform-shell ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
.platform-shell ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.22);
}

/* Cards & Panels */
.platform-shell .platform-content .metric-card,
.platform-shell .platform-content .metric-grid article,
.platform-shell .platform-content .panel,
.platform-shell .platform-content .directory-panel,
.platform-shell .platform-content .platform-card {
  color: var(--text) !important;
  border-color: var(--line) !important;
  background: var(--panel-raised) !important;
  border-radius: 12px !important;
  border-radius: 0 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.16) !important;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.platform-shell .platform-content .metric-card:hover,
.platform-shell .platform-content .metric-grid article:hover {
  border-color: rgba(201, 154, 75, 0.35) !important;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28) !important;
}

.platform-shell .platform-content .panel-heading,
.platform-shell .platform-content .filters,
.platform-shell .platform-content .organization-list > a,
.platform-shell .platform-content .attention-list > a,
.platform-shell .platform-content .detail-list > div {
  border-color: var(--line) !important;
}

.platform-shell .platform-content .organization-list > a:hover {
  background: var(--line-soft) !important;
}

.platform-shell .platform-content .organization-table th {
  background: var(--panel) !important;
  color: var(--text-muted) !important;
  font-weight: 600 !important;
}

.platform-shell .platform-content .organization-table td {
  border-color: var(--line) !important;
}

.platform-shell .platform-content .page-heading p,
.platform-shell .platform-content .panel-heading p,
.platform-shell .platform-content .organization-header p {
  color: var(--text-muted) !important;
}

.platform-shell .platform-content .platform-card h2,
.platform-shell .platform-content .admin-email,
.platform-shell .platform-content .breadcrumb a {
  color: var(--text) !important;
}

/* Metric Colors */
.platform-shell .platform-content .metric-icon.blue {
  color: #93c5fd !important;
  background: rgba(59, 130, 246, 0.14) !important;
  border: 1px solid rgba(59, 130, 246, 0.25) !important;
  border-radius: 0 !important;
}

.platform-shell .platform-content .org-avatar,
.platform-shell .platform-content .timeline-marker {
  color: var(--accent-strong) !important;
  background: var(--accent-soft) !important;
  border: 1px solid rgba(201, 154, 75, 0.3) !important;
  border-radius: 0 !important;
}

.platform-shell .platform-content .metric-icon.green,
.platform-shell .platform-content .healthy-state > div {
  color: var(--signal) !important;
  background: var(--signal-soft) !important;
  border: 1px solid rgba(16, 185, 129, 0.25) !important;
  border-radius: 0 !important;
}

.platform-shell .platform-content .metric-icon.purple {
  color: #c084fc !important;
  background: rgba(168, 85, 247, 0.14) !important;
  border: 1px solid rgba(168, 85, 247, 0.25) !important;
  border-radius: 0 !important;
}

.platform-shell .platform-content .metric-icon.orange {
  color: #fb923c !important;
  background: rgba(249, 115, 22, 0.14) !important;
  border: 1px solid rgba(249, 115, 22, 0.25) !important;
  border-radius: 0 !important;
}

.platform-shell .platform-content .empty-state,
.platform-shell .platform-content .healthy-state {
  color: var(--text-muted) !important;
}

.platform-shell .platform-content .empty-state strong,
.platform-shell .platform-content .healthy-state strong {
  color: var(--text) !important;
}

/* Form fields inside Platform Console */
.platform-shell .v-field {
  background-color: var(--panel) !important;
  border-radius: 8px !important;
  border-radius: 0 !important;
  color: var(--text) !important;
}

.platform-shell .v-field--variant-outlined .v-field__outline {
  --v-field-border-opacity: 0.18;
  color: var(--line) !important;
}

.platform-shell .v-field--variant-outlined.v-field--focused .v-field__outline {
  --v-field-border-opacity: 1;
  color: var(--accent) !important;
}

.platform-shell .v-label {
  color: var(--text-muted) !important;
}

/* Primary buttons inside Platform Console (Unify gold/amber) */
.platform-shell .v-btn--variant-flat.v-btn--color-primary,
.platform-shell .v-btn.bg-primary,
.platform-shell .create-org-quick-btn {
  background: linear-gradient(180deg, #d4a556 0%, #c99a4b 100%) !important;
  color: #0b0f17 !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 10px rgba(201, 154, 75, 0.25) !important;
  border: 1px solid rgba(245, 196, 114, 0.3) !important;
}

.platform-shell .v-btn--variant-flat.v-btn--color-primary:hover,
.platform-shell .v-btn.bg-primary:hover,
.platform-shell .create-org-quick-btn:hover {
  background: linear-gradient(180deg, #e5b35a 0%, #d4a556 100%) !important;
  box-shadow: 0 4px 16px rgba(201, 154, 75, 0.35) !important;
}

.platform-shell .v-btn--variant-tonal.v-btn--color-primary {
  background: rgba(201, 154, 75, 0.12) !important;
  color: #e5b35a !important;
  border: 1px solid rgba(201, 154, 75, 0.3) !important;
}

.platform-shell .v-btn--variant-tonal.v-btn--color-primary:hover {
  background: rgba(201, 154, 75, 0.2) !important;
}

/* Tables inside Platform Console */
.platform-shell .v-table {
  background: transparent !important;
  color: var(--text) !important;
}

.platform-shell .v-table th {
  background: var(--panel) !important;
  color: var(--text-muted) !important;
  font-size: 0.75rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  border-bottom: 1px solid var(--line) !important;
}

.platform-shell .v-table td {
  border-bottom: 1px solid var(--line-soft) !important;
  color: var(--text) !important;
}

.platform-shell .v-table tr:hover td {
  background: var(--line-soft) !important;
}

/* Chips */
.platform-shell .v-chip--variant-tonal.text-primary,
.platform-shell .v-chip--variant-tonal.border-primary {
  background: var(--accent-soft) !important;
  color: var(--accent-strong) !important;
  border-color: rgba(201, 154, 75, 0.3) !important;
}
</style>
