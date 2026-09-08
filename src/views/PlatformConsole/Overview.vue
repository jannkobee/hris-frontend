<template>
  <v-container class="console-page" fluid>
    <div class="page-heading">
      <div>
        <div class="eyebrow">Control plane</div>
        <h1>Platform overview</h1>
        <p>
          Monitor customer health and move quickly on subscription or access
          issues.
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        :to="{ name: 'platform-organization-onboarding' }"
        >New organization</v-btn
      >
    </div>

    <div class="metric-grid">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
      >
        <div class="metric-icon" :class="metric.tone">
          <v-icon :icon="metric.icon" size="22" />
        </div>
        <div>
          <span>{{ metric.label }}</span
          ><strong>{{ metric.value }}</strong
          ><small>{{ metric.note }}</small>
        </div>
      </article>
    </div>

    <div class="platform-health-grid">
      <section class="panel health-panel">
        <div class="panel-heading">
          <div>
            <h2>Platform health</h2>
            <p>Live infrastructure, delivery, queue, and maintenance state.</p>
          </div>
          <div class="d-flex align-center ga-2">
            <v-chip
              :color="healthColor(health?.status)"
              size="small"
              variant="tonal"
              >{{ healthLabel(health?.status) }}</v-chip
            ><v-btn
              icon="mdi-refresh"
              size="small"
              variant="text"
              :loading="healthLoading"
              aria-label="Refresh platform health"
              @click="loadHealth"
            />
          </div>
        </div>
        <v-skeleton-loader v-if="healthLoading && !health" type="article" />
        <div v-else class="health-check-grid">
          <article v-for="check in healthChecks" :key="check.key">
            <div class="health-check-icon" :class="check.tone">
              <v-icon :icon="check.icon" size="19" />
            </div>
            <div>
              <strong>{{ check.label }}</strong>
              <span>{{ check.detail }}</span>
            </div>
            <v-icon
              :icon="
                check.status === 'failed'
                  ? 'mdi-alert-circle'
                  : 'mdi-check-circle'
              "
              :color="
                check.status === 'failed'
                  ? 'error'
                  : check.status === 'warning'
                    ? 'warning'
                    : 'success'
              "
              size="18"
            />
          </article>
        </div>
      </section>

      <section class="panel controls-panel">
        <div class="panel-heading">
          <div>
            <h2>Operational controls</h2>
            <p>Set queue alerts and safely control maintenance mode.</p>
          </div>
          <v-icon icon="mdi-tune-variant" />
        </div>
        <div class="threshold-fields">
          <v-text-field
            v-model.number="healthSettings.failed_jobs_warning"
            label="Warn at failed jobs"
            type="number"
            min="1"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-text-field
            v-model.number="healthSettings.failed_jobs_critical"
            label="Critical at failed jobs"
            type="number"
            min="1"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-text-field
            v-model.number="healthSettings.snapshot_interval_minutes"
            label="Snapshot interval"
            suffix="min"
            type="number"
            min="1"
            density="compact"
            variant="outlined"
            hide-details
          />
        </div>
        <div class="control-actions">
          <v-btn
            color="primary"
            size="small"
            :loading="settingsSaving"
            @click="saveHealthSettings"
            >Save thresholds</v-btn
          >
          <v-chip
            :color="
              health?.checks?.maintenance?.status === 'active'
                ? 'warning'
                : 'success'
            "
            size="small"
            variant="tonal"
            >{{
              health?.checks?.maintenance?.status === "active"
                ? "Maintenance active"
                : "Live traffic enabled"
            }}</v-chip
          >
        </div>
        <v-divider class="my-4" />
        <v-text-field
          v-if="health?.checks?.maintenance?.status !== 'active'"
          v-model="maintenanceReason"
          label="Maintenance reason"
          placeholder="e.g. Applying a payroll platform update"
          density="compact"
          variant="outlined"
          hide-details="auto"
        />
        <div class="control-actions mt-3">
          <v-btn
            :color="
              health?.checks?.maintenance?.status === 'active'
                ? 'success'
                : 'warning'
            "
            variant="tonal"
            size="small"
            :loading="maintenanceSaving"
            :disabled="
              health?.checks?.maintenance?.status !== 'active' &&
              !maintenanceReason.trim()
            "
            @click="toggleMaintenance"
            >{{
              health?.checks?.maintenance?.status === "active"
                ? "Restore traffic"
                : "Enable maintenance"
            }}</v-btn
          >
          <span class="control-hint"
            >The platform console remains available while maintenance is
            active.</span
          >
        </div>
      </section>
    </div>

    <section class="panel health-history-panel">
      <div class="panel-heading">
        <div>
          <h2>Health history</h2>
          <p>Recent point-in-time checks retained for operator review.</p>
        </div>
      </div>
      <div v-if="healthHistory.length" class="health-history-list">
        <div v-for="entry in healthHistory" :key="entry.id">
          <v-icon
            :icon="
              entry.status === 'degraded'
                ? 'mdi-alert-circle'
                : 'mdi-check-circle'
            "
            :color="healthColor(entry.status)"
            size="18"
          />
          <strong>{{ healthLabel(entry.status) }}</strong>
          <span>{{ date(entry.captured_at) }}</span>
          <small>{{ historySummary(entry) }}</small>
        </div>
      </div>
      <div v-else class="history-empty">
        Health snapshots will appear after the first platform check.
      </div>
    </section>

    <div class="overview-grid">
      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>Recent organizations</h2>
            <p>Latest customer workspaces in the platform.</p>
          </div>
          <v-btn
            variant="text"
            size="small"
            append-icon="mdi-arrow-right"
            :to="{ name: 'platform-organizations' }"
            >View all</v-btn
          >
        </div>
        <v-skeleton-loader v-if="loading" type="list-item-three-line@4" />
        <div v-else-if="recentOrganizations.length" class="organization-list">
          <RouterLink
            v-for="organization in recentOrganizations"
            :key="organization.id"
            :to="{
              name: 'platform-organization-detail',
              params: { id: organization.id },
            }"
            ><div class="org-avatar">{{ initials(organization.name) }}</div>
            <div class="org-copy">
              <strong>{{ organization.name }}</strong
              ><span
                >{{ organization.slug }} / {{ organization.country_code }}</span
              >
            </div>
            <v-chip
              :color="statusColor(organization.subscription_status)"
              variant="tonal"
              size="small"
              >{{ label(organization.subscription_status) }}</v-chip
            ><v-icon icon="mdi-chevron-right" color="medium-emphasis"
          /></RouterLink>
        </div>
        <div v-else class="empty-state">
          <v-icon icon="mdi-domain-off" size="36" /><strong
            >No organizations yet</strong
          ><span>Create your first customer workspace to get started.</span>
        </div>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>Needs attention</h2>
            <p>Subscriptions requiring an operator review.</p>
          </div>
        </div>
        <div v-if="attentionOrganizations.length" class="attention-list">
          <RouterLink
            v-for="organization in attentionOrganizations"
            :key="organization.id"
            :to="{
              name: 'platform-organization-detail',
              params: { id: organization.id },
            }"
            ><v-icon
              :icon="
                organization.subscription_status === 'past_due'
                  ? 'mdi-credit-card-alert-outline'
                  : 'mdi-alert-circle-outline'
              "
              :color="statusColor(organization.subscription_status)"
            />
            <div>
              <strong>{{ organization.name }}</strong
              ><span
                >{{
                  label(organization.subscription_status)
                }}
                subscription</span
              >
            </div></RouterLink
          >
        </div>
        <div v-else class="healthy-state">
          <div><v-icon icon="mdi-check" color="success" /></div>
          <strong>Everything looks healthy</strong
          ><span>No past-due or suspended subscriptions.</span>
        </div>
      </section>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import { platformHeaders } from "@/composables/PlatformConsole/usePlatformAuth";

const loading = ref(false);
const healthLoading = ref(false);
const settingsSaving = ref(false);
const maintenanceSaving = ref(false);
const organizations = ref<any[]>([]);
const health = ref<any>(null);
const healthHistory = ref<any[]>([]);
const healthSettings = ref({
  failed_jobs_warning: 1,
  failed_jobs_critical: 5,
  snapshot_interval_minutes: 5,
});
const maintenanceReason = ref("");
const activeCount = computed(
  () =>
    organizations.value.filter((item) => item.subscription_status === "active")
      .length,
);
const trialCount = computed(
  () =>
    organizations.value.filter(
      (item) => item.subscription_status === "trialing",
    ).length,
);
const employeeCount = computed(() =>
  organizations.value.reduce(
    (total, item) => total + Number(item.usage?.employees ?? 0),
    0,
  ),
);
const attentionOrganizations = computed(() =>
  organizations.value
    .filter((item) =>
      ["past_due", "suspended"].includes(item.subscription_status),
    )
    .slice(0, 6),
);
const recentOrganizations = computed(() => organizations.value.slice(0, 6));
const metrics = computed(() => [
  {
    label: "Organizations",
    value: organizations.value.length,
    note: "Customer workspaces",
    icon: "mdi-domain",
    tone: "blue",
  },
  {
    label: "Active",
    value: activeCount.value,
    note: "Paid subscriptions",
    icon: "mdi-check-decagram-outline",
    tone: "green",
  },
  {
    label: "On trial",
    value: trialCount.value,
    note: "Conversion pipeline",
    icon: "mdi-timer-sand",
    tone: "purple",
  },
  {
    label: "Employees",
    value: employeeCount.value.toLocaleString(),
    note: "Across loaded organizations",
    icon: "mdi-account-group-outline",
    tone: "orange",
  },
]);
const healthChecks = computed(() => {
  const checks = health.value?.checks ?? {};
  const queue = checks.queue ?? {};
  const mail = checks.mail ?? {};
  const maintenance = checks.maintenance ?? {};

  return [
    {
      key: "database",
      label: "Database",
      detail: healthLabel(checks.database?.status),
      status: checks.database?.status ?? "unknown",
      icon: "mdi-database-check-outline",
      tone: "blue",
    },
    {
      key: "cache",
      label: "Cache",
      detail: healthLabel(checks.cache?.status),
      status: checks.cache?.status ?? "unknown",
      icon: "mdi-memory",
      tone: "purple",
    },
    {
      key: "storage",
      label: "Private storage",
      detail: healthLabel(checks.storage?.status),
      status: checks.storage?.status ?? "unknown",
      icon: "mdi-folder-lock-outline",
      tone: "green",
    },
    {
      key: "queue",
      label: "Queue",
      detail: `${Number(queue.failed_jobs ?? 0)} failed jobs`,
      status: queue.status ?? "unknown",
      icon: "mdi-format-list-checks",
      tone: "orange",
    },
    {
      key: "mail",
      label: "Mail",
      detail: `${mail.mailer ?? "Unknown"} / ${mail.delivery_mode ?? "unknown"}`,
      status: mail.status ?? "unknown",
      icon: "mdi-email-check-outline",
      tone: "blue",
    },
    {
      key: "maintenance",
      label: "Traffic",
      detail:
        maintenance.status === "active"
          ? "Maintenance mode"
          : "Serving traffic",
      status: maintenance.status === "active" ? "warning" : "ok",
      icon: "mdi-traffic-cone",
      tone: "purple",
    },
  ];
});
const statusColor = (value: string) =>
  (
    ({
      active: "success",
      trialing: "info",
      past_due: "warning",
      suspended: "error",
      cancelled: "secondary",
    }) as Record<string, string>
  )[value] ?? "secondary";
const healthColor = (value?: string) =>
  (
    ({
      ok: "success",
      configured: "success",
      warning: "warning",
      maintenance: "warning",
      degraded: "error",
      failed: "error",
      active: "warning",
    }) as Record<string, string>
  )[String(value)] ?? "secondary";
const healthLabel = (value?: string) =>
  String(value ?? "Unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
const label = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not recorded";
const historySummary = (entry: any) => {
  const failedJobs = Number(entry.checks?.queue?.failed_jobs ?? 0);
  const maintenance = entry.checks?.maintenance?.status === "active";

  return maintenance
    ? "Maintenance mode was active"
    : `${failedJobs} failed queue job${failedJobs === 1 ? "" : "s"}`;
};
const loadHealth = async () => {
  healthLoading.value = true;
  try {
    const [healthResponse, settingsResponse, historyResponse] =
      await Promise.all([
        axios.get("/platform/health", { headers: platformHeaders() }),
        axios.get("/platform/health/settings", { headers: platformHeaders() }),
        axios.get("/platform/health/history", {
          params: { limit: 8 },
          headers: platformHeaders(),
        }),
      ]);

    health.value = healthResponse.data.data;
    healthSettings.value = settingsResponse.data.data;
    healthHistory.value = historyResponse.data.data ?? [];
  } finally {
    healthLoading.value = false;
  }
};
const saveHealthSettings = async () => {
  settingsSaving.value = true;
  try {
    const response = await axios.patch(
      "/platform/health/settings",
      healthSettings.value,
      { headers: platformHeaders() },
    );
    healthSettings.value = response.data.data;
    await loadHealth();
  } finally {
    settingsSaving.value = false;
  }
};
const toggleMaintenance = async () => {
  const enabling = health.value?.checks?.maintenance?.status !== "active";
  const action = enabling ? "enable maintenance mode" : "restore live traffic";
  if (!window.confirm(`Are you sure you want to ${action}?`)) return;

  maintenanceSaving.value = true;
  try {
    await axios.patch(
      "/platform/maintenance",
      {
        enabled: enabling,
        retry_after: 300,
        reason: enabling ? maintenanceReason.value.trim() : null,
      },
      { headers: platformHeaders() },
    );
    maintenanceReason.value = "";
    await loadHealth();
  } finally {
    maintenanceSaving.value = false;
  }
};
const load = async () => {
  loading.value = true;
  try {
    const [response] = await Promise.all([
      axios.get("/platform/organizations", {
        params: { per_page: 100 },
        headers: platformHeaders(),
      }),
      loadHealth(),
    ]);
    organizations.value = response.data.data?.data ?? [];
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>

<style scoped>
.console-page {
  max-width: 1500px;
  margin: 0 auto;
  padding: 32px;
}
.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;
}
.eyebrow {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6576ff;
}
.page-heading h1 {
  margin-top: 4px;
  font-size: 1.75rem;
  letter-spacing: -0.035em;
}
.page-heading p,
.panel-heading p {
  margin-top: 4px;
  color: #737e92;
  font-size: 0.88rem;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.metric-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 1px solid #e4e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 5px 18px rgba(24, 35, 58, 0.035);
}
.metric-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
}
.metric-icon.blue {
  color: #5267e8;
  background: #eef0ff;
}
.metric-icon.green {
  color: #169c63;
  background: #e9f8f1;
}
.metric-icon.purple {
  color: #8b55d9;
  background: #f4edff;
}
.metric-icon.orange {
  color: #d17a16;
  background: #fff3e4;
}
.metric-card > div:last-child {
  display: flex;
  flex-direction: column;
}
.metric-card span {
  font-size: 0.74rem;
  color: #7b8598;
}
.metric-card strong {
  font-size: 1.45rem;
  line-height: 1.2;
}
.metric-card small {
  font-size: 0.68rem;
  color: #9aa3b3;
}
.platform-health-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(330px, 0.9fr);
  gap: 18px;
  margin-top: 18px;
}
.health-panel,
.controls-panel,
.health-history-panel {
  min-height: auto;
}
.health-check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  padding-top: 18px;
}
.health-check-grid article {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 11px;
  border: 1px solid #28313f;
  border-radius: 10px;
  background: #111721;
}
.health-check-icon {
  width: 34px;
  height: 34px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 9px;
}
.health-check-icon.blue {
  color: #9dcfff;
  background: rgba(80, 145, 214, 0.14);
}
.health-check-icon.green {
  color: #66d69a;
  background: rgba(48, 171, 112, 0.13);
}
.health-check-icon.purple {
  color: #c7a5ff;
  background: rgba(145, 93, 211, 0.14);
}
.health-check-icon.orange {
  color: #f1b56c;
  background: rgba(209, 122, 22, 0.14);
}
.health-check-grid article > div:nth-child(2) {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.health-check-grid strong {
  font-size: 0.76rem;
}
.health-check-grid span {
  overflow: hidden;
  margin-top: 2px;
  color: #8c98ab;
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.threshold-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding-top: 18px;
}
.control-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.control-actions:first-of-type {
  margin-top: 14px;
}
.control-hint {
  color: #8995a8;
  font-size: 0.68rem;
  line-height: 1.35;
  text-align: right;
}
.health-history-panel {
  margin-top: 18px;
}
.health-history-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding-top: 16px;
}
.health-history-list > div {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 8px;
  row-gap: 2px;
  padding: 11px;
  border: 1px solid #28313f;
  border-radius: 10px;
  background: #111721;
}
.health-history-list .v-icon {
  grid-row: span 2;
  margin-top: 2px;
}
.health-history-list strong {
  font-size: 0.72rem;
}
.health-history-list span,
.health-history-list small {
  color: #8c98ab;
  font-size: 0.65rem;
}
.health-history-list small {
  grid-column: 1 / -1;
  margin-top: 5px;
}
.history-empty {
  padding: 28px 0 4px;
  color: #8995a8;
  font-size: 0.78rem;
}
.overview-grid {
  display: grid;
  grid-template-columns: 1.6fr 0.8fr;
  gap: 18px;
  margin-top: 18px;
}
.panel {
  min-height: 360px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel-raised);
  color: var(--text);
}
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.panel-heading h2 {
  font-size: 1rem;
  color: var(--text);
}
.organization-list > a {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--line-soft);
  color: inherit;
  text-decoration: none;
}
.organization-list > a:hover {
  background: var(--line-soft);
}
.org-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--accent-strong);
  background: var(--accent-soft);
  border: 1px solid rgba(201, 154, 75, 0.3);
  font-size: 0.75rem;
  font-weight: 800;
}
.org-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.org-copy strong {
  font-size: 0.87rem;
  color: var(--text);
}
.org-copy span,
.attention-list span {
  font-size: 0.72rem;
  color: var(--text-muted);
}
.attention-list > a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 3px;
  border-bottom: 1px solid var(--line-soft);
  color: inherit;
  text-decoration: none;
}
.attention-list a > div {
  display: flex;
  flex-direction: column;
}
.attention-list strong {
  font-size: 0.84rem;
  color: var(--text);
}
.healthy-state,
.empty-state {
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
}
.healthy-state > div {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  border-radius: 50%;
  background: var(--signal-soft);
  color: var(--signal);
}
.healthy-state strong,
.empty-state strong {
  color: var(--text);
}
.healthy-state span,
.empty-state span {
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .platform-health-grid {
    grid-template-columns: 1fr;
  }
  .health-history-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .console-page {
    padding: 22px 16px;
  }
  .page-heading {
    flex-direction: column;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
  .health-check-grid,
  .threshold-fields,
  .health-history-list {
    grid-template-columns: 1fr;
  }
  .control-actions {
    align-items: flex-start;
    flex-direction: column;
  }
  .control-hint {
    text-align: left;
  }
  .panel {
    padding: 18px;
  }
  .organization-list .v-chip {
    display: none;
  }
}
</style>
