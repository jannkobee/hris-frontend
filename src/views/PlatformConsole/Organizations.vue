<template>
  <v-container class="console-page" fluid>
    <div class="page-heading">
      <div>
        <div class="eyebrow">Customer directory</div>
        <h1>Organizations</h1>
        <p>Manage workspaces, subscriptions, usage, and customer access.</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        :to="{ name: 'platform-organization-onboarding' }"
        >New organization</v-btn
      >
    </div>

    <div class="summary-row">
      <div>
        <span>Total organizations</span
        ><strong>{{ organizations.length }}</strong>
      </div>
      <div>
        <span>Active and trialing</span><strong>{{ healthyCount }}</strong>
      </div>
      <div>
        <span>Needs attention</span
        ><strong :class="{ warning: attentionCount > 0 }">{{
          attentionCount
        }}</strong>
      </div>
    </div>

    <section class="directory-panel">
      <div class="filters">
        <v-text-field
          v-model="search"
          label="Search organizations"
          placeholder="Name, slug, or administrator"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          @keyup.enter="load"
        /><v-select
          v-model="status"
          label="Subscription status"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          clearable
          variant="outlined"
          density="comfortable"
          hide-details
        /><v-btn
          color="primary"
          variant="tonal"
          height="48"
          :loading="loading"
          @click="load"
          >Apply filters</v-btn
        >
      </div>
      <v-data-table
        :headers="headers"
        :items="organizations"
        :loading="loading"
        :items-per-page="15"
        hover
        class="organization-table"
        no-data-text="No organizations match the current filters."
      >
        <template #item.organization="{ item }"
          ><div class="organization-cell">
            <div class="org-avatar">{{ initials(item.name) }}</div>
            <div>
              <strong>{{ item.name }}</strong
              ><span>{{ item.slug }} / {{ item.country_code }}</span>
            </div>
          </div></template
        >
        <template #item.subscription="{ item }"
          ><div class="subscription-cell">
            <v-chip
              size="small"
              :color="statusColor(item.subscription_status)"
              variant="tonal"
              ><span class="status-dot" />{{
                label(item.subscription_status)
              }}</v-chip
            ><span>{{ label(item.plan_code) }}</span>
          </div></template
        >
        <template #item.usage="{ item }"
          ><div class="usage-cell">
            <div>
              <span>{{ item.usage.employees }} employees</span
              ><small>{{
                item.usage.employee_limit
                  ? `of ${item.usage.employee_limit}`
                  : "No limit"
              }}</small>
            </div>
            <v-progress-linear
              v-if="item.usage.percentage !== null"
              :model-value="Math.min(item.usage.percentage, 100)"
              :color="item.usage.percentage >= 90 ? 'warning' : 'primary'"
              height="5"
              rounded
            /></div
        ></template>
        <template #item.period="{ item }"
          ><div class="date-cell">
            {{ date(item.current_period_ends_at || item.trial_ends_at)
            }}<span>{{
              item.subscription_status === "trialing"
                ? "Trial expiry"
                : "Period end"
            }}</span>
          </div></template
        >
        <template #item.administrator="{ item }"
          ><span class="admin-email">{{
            item.administrator?.email ?? "Not assigned"
          }}</span></template
        >
        <template #item.actions="{ item }"
          ><v-btn
            icon="mdi-arrow-right"
            color="primary"
            size="small"
            variant="text"
            :to="{
              name: 'platform-organization-detail',
              params: { id: item.id },
            }"
        /></template>
      </v-data-table>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import { platformHeaders } from "@/composables/PlatformConsole/usePlatformAuth";

const search = ref("");
const status = ref<string | null>(null);
const loading = ref(false);
const organizations = ref<any[]>([]);
const statusOptions = [
  { title: "Trialing", value: "trialing" },
  { title: "Active", value: "active" },
  { title: "Past due", value: "past_due" },
  { title: "Suspended", value: "suspended" },
  { title: "Cancelled", value: "cancelled" },
];
const headers = [
  { title: "Organization", key: "organization" },
  { title: "Subscription", key: "subscription" },
  { title: "Usage", key: "usage" },
  { title: "Renewal", key: "period" },
  { title: "Administrator", key: "administrator" },
  { title: "", key: "actions", sortable: false },
];
const healthyCount = computed(
  () =>
    organizations.value.filter((item) =>
      ["active", "trialing"].includes(item.subscription_status),
    ).length,
);
const attentionCount = computed(
  () =>
    organizations.value.filter((item) =>
      ["past_due", "suspended"].includes(item.subscription_status),
    ).length,
);
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not set";
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
const load = async () => {
  loading.value = true;
  try {
    const response = await axios.get("/platform/organizations", {
      params: {
        search: search.value || undefined,
        subscription_status: status.value || undefined,
        per_page: 100,
      },
      headers: platformHeaders(),
    });
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
  margin-bottom: 24px;
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
.page-heading p {
  margin-top: 4px;
  color: #737e92;
  font-size: 0.88rem;
}
.summary-row {
  display: flex;
  gap: 34px;
  margin-bottom: 18px;
  padding: 0 4px;
}
.summary-row > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.summary-row span {
  font-size: 0.72rem;
  color: #8993a6;
}
.summary-row strong {
  font-size: 1rem;
}
.summary-row strong.warning {
  color: #c57918;
}
.directory-panel {
  overflow: hidden;
  border: 1px solid #e3e7ef;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 6px 22px rgba(24, 35, 58, 0.035);
}
.filters {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 230px auto;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #edf0f5;
}
.organization-table :deep(th) {
  height: 48px !important;
  background: #fafbfc !important;
  color: #748095 !important;
  font-size: 0.68rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.organization-table :deep(td) {
  height: 70px !important;
}
.organization-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.org-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 10px;
  color: #5367d8;
  background: #eef0ff;
  font-size: 0.72rem;
  font-weight: 800;
}
.organization-cell > div:last-child,
.subscription-cell,
.date-cell {
  display: flex;
  flex-direction: column;
}
.organization-cell strong {
  font-size: 0.86rem;
}
.organization-cell span,
.subscription-cell > span,
.date-cell span {
  font-size: 0.7rem;
  color: #8a94a7;
}
.subscription-cell {
  align-items: flex-start;
  gap: 4px;
}
.status-dot {
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: currentColor;
}
.usage-cell {
  width: 130px;
}
.usage-cell > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 0.75rem;
}
.usage-cell small {
  color: #8b95a7;
}
.date-cell {
  font-size: 0.8rem;
}
.admin-email {
  font-size: 0.78rem;
  color: #556074;
}
@media (max-width: 760px) {
  .console-page {
    padding: 22px 14px;
  }
  .page-heading {
    flex-direction: column;
  }
  .summary-row {
    overflow: auto;
    gap: 20px;
  }
  .summary-row > div {
    min-width: max-content;
  }
  .filters {
    grid-template-columns: 1fr;
  }
  .organization-table {
    border-radius: 0;
  }
}
</style>
