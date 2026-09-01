<template>
  <v-app class="platform-shell">
    <div v-if="mobileOpen" class="sidebar-scrim" @click="mobileOpen = false" />
    <aside class="platform-sidebar" :class="{ open: mobileOpen }">
      <div class="platform-brand">
        <div class="brand-mark"><img :src="appIcon" alt="LexisOne" /></div>
        <div><strong>LexisOne</strong><span>Platform operations</span></div>
        <v-btn
          class="mobile-close"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="mobileOpen = false"
        />
      </div>

      <div class="nav-label">Workspace</div>
      <nav>
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="{ name: item.name }"
          :class="{ active: isActive(item.name) }"
          @click="mobileOpen = false"
        >
          <v-icon :icon="item.icon" size="20" /><span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="environment-card">
        <span class="status-dot" />
        <div><strong>Platform API</strong><small>Connected session</small></div>
      </div>
      <div class="sidebar-footer">
        <RouterLink to="/saas"
          ><v-icon icon="mdi-open-in-new" size="18" />Public website</RouterLink
        >
        <button type="button" @click="logout">
          <v-icon icon="mdi-logout" size="18" />End staff session
        </button>
      </div>
    </aside>

    <main class="platform-main">
      <header class="platform-topbar">
        <div class="topbar-title">
          <v-btn
            class="mobile-menu"
            icon="mdi-menu"
            size="small"
            variant="text"
            @click="mobileOpen = true"
          />
          <div>
            <span>Internal operations</span><strong>{{ title }}</strong>
          </div>
        </div>
        <div class="topbar-actions">
          <v-chip
            color="warning"
            variant="tonal"
            size="small"
            prepend-icon="mdi-shield-lock-outline"
            >Staff only</v-chip
          ><v-avatar size="34" color="primary" variant="tonal"
            ><v-icon icon="mdi-account-tie" size="19"
          /></v-avatar>
        </div>
      </header>
      <div class="platform-content"><RouterView /></div>
    </main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "vuetify";
import { clearPlatformSession } from "@/composables/PlatformConsole/usePlatformAuth";
import appIcon from "@/assets/Assets.xcassets/AppIcon.appiconset/100.png";

const route = useRoute();
const router = useRouter();
const theme = useTheme();
const mobileOpen = ref(false);
const previousTheme = theme.global.name.value;
const navigation = [
  {
    name: "platform-overview",
    label: "Overview",
    icon: "mdi-view-dashboard-outline",
  },
  {
    name: "platform-organizations",
    label: "Organizations",
    icon: "mdi-domain",
  },
  {
    name: "platform-organization-onboarding",
    label: "Create organization",
    icon: "mdi-plus-box-outline",
  },
];
const title = computed(() =>
  String(route.meta.platformTitle ?? "Platform Console"),
);
const isActive = (name: string) =>
  name === "platform-organizations"
    ? ["platform-organizations", "platform-organization-detail"].includes(
        String(route.name),
      )
    : route.name === name;
const logout = () => {
  clearPlatformSession();
  router.push({ name: "platform-console-login" });
};
onMounted(() => {
  theme.global.name.value = "dark";
});
onBeforeUnmount(() => {
  theme.global.name.value = previousTheme;
});
</script>

<style scoped>
.platform-shell {
  min-height: 100vh;
  background: #0d1119;
  color: #dfe5ef;
}
.platform-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 264px;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  background: linear-gradient(180deg, #090d15 0%, #070a11 100%);
  color: #f3f6ff;
  z-index: 30;
  border-right: 1px solid #202735;
  box-shadow: 10px 0 32px rgba(0, 0, 0, 0.16);
}
.platform-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 30px;
}
.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #343b48;
  border-radius: 12px;
  background: #f4f2ee;
}
.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.platform-brand > div:nth-child(2) {
  display: flex;
  flex-direction: column;
}
.platform-brand strong {
  letter-spacing: -0.02em;
}
.platform-brand span {
  font-size: 0.7rem;
  color: #7f8aa2;
}
.nav-label {
  padding: 0 12px 9px;
  color: #5f6a80;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.platform-sidebar nav {
  display: grid;
  gap: 5px;
}
.platform-sidebar a,
.platform-sidebar button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  border: 0;
  border-radius: 10px;
  color: #9da8bd;
  background: transparent;
  text-decoration: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: 0.18s ease;
}
.platform-sidebar a:hover,
.platform-sidebar button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
.platform-sidebar nav a.active {
  color: #f0f5ff;
  background: linear-gradient(
    90deg,
    rgba(144, 202, 249, 0.16),
    rgba(144, 202, 249, 0.05)
  );
  box-shadow: inset 3px 0 #90caf9;
}
.environment-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 13px;
  border: 1px solid #232a38;
  border-radius: 12px;
  background: #101620;
}
.environment-card div {
  display: flex;
  flex-direction: column;
}
.environment-card strong {
  font-size: 0.78rem;
}
.environment-card small {
  color: #77829a;
  font-size: 0.67rem;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #43d18b;
  box-shadow: 0 0 0 4px rgba(67, 209, 139, 0.12);
}
.sidebar-footer {
  display: grid;
  gap: 3px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #202735;
}
.platform-main {
  min-height: 100vh;
  margin-left: 264px;
  background: #0d1119;
}
.platform-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  border-bottom: 1px solid #242b38;
  background: rgba(15, 20, 29, 0.92);
  backdrop-filter: blur(16px);
}
.topbar-title,
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-title > div {
  display: flex;
  flex-direction: column;
}
.topbar-title span {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #778298;
}
.topbar-title strong {
  font-size: 1.08rem;
  letter-spacing: -0.01em;
}
.platform-content {
  min-height: calc(100vh - 72px);
}
.mobile-menu,
.mobile-close {
  display: none;
}
.sidebar-scrim {
  display: none;
}
@media (max-width: 820px) {
  .platform-sidebar {
    transform: translateX(-105%);
    transition: transform 0.2s ease;
  }
  .platform-sidebar.open {
    transform: translateX(0);
  }
  .sidebar-scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.68);
    z-index: 25;
  }
  .platform-main {
    margin-left: 0;
  }
  .mobile-menu,
  .mobile-close {
    display: inline-flex;
  }
  .mobile-close {
    margin-left: auto;
  }
  .platform-topbar {
    padding: 0 18px;
  }
  .topbar-actions .v-avatar {
    display: none;
  }
}
</style>

<style>
.platform-shell .platform-content .metric-card,
.platform-shell .platform-content .metric-grid article,
.platform-shell .platform-content .panel,
.platform-shell .platform-content .directory-panel,
.platform-shell .platform-content .platform-card {
  color: #dce3ed !important;
  border-color: #272f3d !important;
  background: #151b25 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}
.platform-shell .platform-content .panel-heading,
.platform-shell .platform-content .filters,
.platform-shell .platform-content .organization-list > a,
.platform-shell .platform-content .attention-list > a,
.platform-shell .platform-content .detail-list > div {
  border-color: #262e3b !important;
}
.platform-shell .platform-content .organization-list > a:hover {
  background: #1a212d !important;
}
.platform-shell .platform-content .organization-table th {
  background: #111721 !important;
  color: #8793a7 !important;
}
.platform-shell .platform-content .organization-table td {
  border-color: #252d39 !important;
}
.platform-shell .platform-content .page-heading p,
.platform-shell .platform-content .panel-heading p,
.platform-shell .platform-content .organization-header p {
  color: #8994a7 !important;
}
.platform-shell .platform-content .platform-card h2,
.platform-shell .platform-content .admin-email,
.platform-shell .platform-content .breadcrumb a {
  color: #cbd4e0 !important;
}
.platform-shell .platform-content .metric-icon.blue,
.platform-shell .platform-content .org-avatar {
  color: #9dcfff !important;
  background: rgba(80, 145, 214, 0.14) !important;
}
.platform-shell .platform-content .metric-icon.green,
.platform-shell .platform-content .healthy-state > div {
  background: rgba(48, 171, 112, 0.13) !important;
}
.platform-shell .platform-content .metric-icon.purple {
  background: rgba(145, 93, 211, 0.14) !important;
}
.platform-shell .platform-content .metric-icon.orange {
  background: rgba(209, 122, 22, 0.14) !important;
}
.platform-shell .platform-content .timeline-marker {
  color: #a6d4ff !important;
  background: rgba(80, 145, 214, 0.14) !important;
}
.platform-shell .platform-content .empty-state,
.platform-shell .platform-content .healthy-state {
  color: #8490a3 !important;
}
.platform-shell .platform-content .empty-state strong,
.platform-shell .platform-content .healthy-state strong {
  color: #d9e0ea !important;
}
</style>
