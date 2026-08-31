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
const organizations = ref<any[]>([]);
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
const load = async () => {
  loading.value = true;
  try {
    const response = await axios.get("/platform/organizations", {
      params: { per_page: 100 },
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
.overview-grid {
  display: grid;
  grid-template-columns: 1.6fr 0.8fr;
  gap: 18px;
  margin-top: 18px;
}
.panel {
  min-height: 360px;
  padding: 24px;
  border: 1px solid #e4e8f0;
  border-radius: 14px;
  background: #fff;
}
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 18px;
  border-bottom: 1px solid #edf0f5;
}
.panel-heading h2 {
  font-size: 1rem;
}
.organization-list > a {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 4px;
  border-bottom: 1px solid #f0f2f6;
  color: inherit;
  text-decoration: none;
}
.organization-list > a:hover {
  background: #fafbfe;
}
.org-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #5367d8;
  background: #eef0ff;
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
}
.org-copy span,
.attention-list span {
  font-size: 0.72rem;
  color: #8a94a7;
}
.attention-list > a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 3px;
  border-bottom: 1px solid #f0f2f6;
  color: inherit;
  text-decoration: none;
}
.attention-list a > div {
  display: flex;
  flex-direction: column;
}
.attention-list strong {
  font-size: 0.84rem;
}
.healthy-state,
.empty-state {
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #8c96a8;
}
.healthy-state > div {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  border-radius: 50%;
  background: #e9f8f1;
}
.healthy-state strong,
.empty-state strong {
  color: #313b4e;
}
.healthy-state span,
.empty-state span {
  margin-top: 4px;
  font-size: 0.78rem;
}
@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
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
  .panel {
    padding: 18px;
  }
  .organization-list .v-chip {
    display: none;
  }
}
</style>
