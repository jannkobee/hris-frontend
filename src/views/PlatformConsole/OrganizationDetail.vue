<template>
  <v-container class="console-page" fluid>
    <div class="breadcrumb">
      <RouterLink :to="{ name: 'platform-organizations' }"
        ><v-icon icon="mdi-arrow-left" size="17" />Organizations</RouterLink
      >
    </div>
    <v-skeleton-loader
      v-if="loading && !organization"
      type="heading, paragraph, article, article"
    />
    <template v-else-if="organization">
      <div class="organization-header">
        <div class="organization-identity">
          <div class="org-avatar">{{ initials(organization.name) }}</div>
          <div>
            <div class="d-flex align-center flex-wrap ga-2">
              <h1>{{ organization.name }}</h1>
              <v-chip
                :color="statusColor(organization.subscription_status)"
                size="small"
                variant="tonal"
                >{{ label(organization.subscription_status) }}</v-chip
              >
            </div>
            <p>
              {{ organization.slug }} / {{ organization.country_code }} /
              {{ organization.timezone }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn
            variant="tonal"
            prepend-icon="mdi-sync"
            :loading="reconciling"
            @click="reconcileSubscription"
            >Reconcile</v-btn
          ><v-btn
            :color="organization.status === 'active' ? 'error' : 'success'"
            variant="tonal"
            :loading="supporting"
            @click="
              setOrganizationStatus(
                organization.status === 'active' ? 'suspended' : 'active',
              )
            "
            >{{
              organization.status === "active" ? "Suspend" : "Reactivate"
            }}</v-btn
          >
        </div>
      </div>

      <div class="metric-grid">
        <article>
          <div class="metric-icon blue">
            <v-icon icon="mdi-package-variant-closed" />
          </div>
          <div>
            <span>Current plan</span
            ><strong>{{ organization.plan.name }}</strong
            ><small>{{ label(organization.subscription_status) }}</small>
          </div>
        </article>
        <article>
          <div class="metric-icon purple">
            <v-icon icon="mdi-account-group-outline" />
          </div>
          <div>
            <span>Employee usage</span
            ><strong
              >{{ organization.usage.employees }} /
              {{ organization.usage.employee_limit ?? "No limit" }}</strong
            ><small>{{ usageMessage }}</small>
          </div>
        </article>
        <article>
          <div class="metric-icon green">
            <v-icon icon="mdi-calendar-check-outline" />
          </div>
          <div>
            <span>{{
              organization.subscription_status === "trialing"
                ? "Trial ends"
                : "Period ends"
            }}</span
            ><strong>{{
              shortDate(
                organization.trial_ends_at ||
                  organization.current_period_ends_at,
              )
            }}</strong
            ><small>{{
              organization.billing.provider ?? "Manual billing"
            }}</small>
          </div>
        </article>
        <article>
          <div class="metric-icon orange">
            <v-icon icon="mdi-account-key-outline" />
          </div>
          <div>
            <span>Identity</span
            ><strong>{{
              organization.identity.sso_active ? "SSO active" : "Password login"
            }}</strong
            ><small
              >{{ organization.identity.active_scim_tokens }} active SCIM
              tokens</small
            >
          </div>
        </article>
      </div>

      <div class="detail-grid">
        <div class="primary-column">
          <section class="panel">
            <div class="panel-heading">
              <div>
                <h2>Subscription configuration</h2>
                <p>
                  Control entitlements, lifecycle status, and workforce
                  capacity.
                </p>
              </div>
              <v-icon icon="mdi-credit-card-settings-outline" />
            </div>
            <v-row
              ><v-col cols="12" sm="6"
                ><v-select
                  v-model="operations.plan_code"
                  label="Plan"
                  :items="plans"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable" /></v-col
              ><v-col cols="12" sm="6"
                ><v-select
                  v-model="operations.subscription_status"
                  label="Subscription status"
                  :items="statuses"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable" /></v-col
              ><v-col cols="12" sm="6"
                ><v-text-field
                  v-model="operations.trial_ends_at"
                  label="Trial ends"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable" /></v-col
              ><v-col cols="12" sm="6"
                ><v-text-field
                  v-model="operations.current_period_ends_at"
                  label="Billing period ends"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable" /></v-col
              ><v-col cols="12" sm="6"
                ><v-text-field
                  v-model="operations.employee_limit"
                  label="Employee limit override"
                  type="number"
                  min="1"
                  hint="Blank uses the plan default"
                  persistent-hint
                  variant="outlined"
                  density="comfortable" /></v-col
            ></v-row>
            <div class="panel-actions">
              <v-btn color="primary" :loading="saving" @click="saveSubscription"
                >Save changes</v-btn
              ><v-btn
                variant="tonal"
                prepend-icon="mdi-open-in-new"
                :loading="creatingCheckout"
                :disabled="!checkoutEligible"
                @click="createCheckout"
                >Create checkout link</v-btn
              >
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <div>
                <h2>Billing and lifecycle activity</h2>
                <p>Provider events and internal subscription transitions.</p>
              </div>
              <v-icon icon="mdi-timeline-clock-outline" />
            </div>
            <div
              v-if="organization.subscription_events.length"
              class="timeline"
            >
              <div
                v-for="event in organization.subscription_events"
                :key="event.id"
                class="timeline-item"
              >
                <div class="timeline-marker">
                  <v-icon
                    :icon="
                      event.source === 'stripe'
                        ? 'mdi-credit-card-outline'
                        : 'mdi-swap-horizontal'
                    "
                    size="17"
                  />
                </div>
                <div>
                  <strong>{{ label(event.event_type) }}</strong>
                  <p>{{ eventDescription(event) }}</p>
                  <span>{{ date(event.created_at) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              No subscription activity has been recorded.
            </div>
          </section>
        </div>

        <aside class="secondary-column">
          <section class="panel compact">
            <div class="panel-heading">
              <div>
                <h2>Customer details</h2>
                <p>Primary workspace information.</p>
              </div>
            </div>
            <dl class="detail-list">
              <div>
                <dt>Administrator</dt>
                <dd>
                  {{ organization.administrator?.email ?? "Not assigned" }}
                </dd>
              </div>
              <div>
                <dt>Billing provider</dt>
                <dd>{{ organization.billing.provider ?? "Manual" }}</dd>
              </div>
              <div>
                <dt>Customer ID</dt>
                <dd>
                  <span>{{
                    organization.billing.customer_id || "Not linked"
                  }}</span
                  ><v-btn
                    v-if="organization.billing.customer_id"
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    @click="copy(organization.billing.customer_id)"
                  />
                </dd>
              </div>
              <div>
                <dt>Subscription ID</dt>
                <dd>
                  <span>{{
                    organization.billing.subscription_id || "Not linked"
                  }}</span
                  ><v-btn
                    v-if="organization.billing.subscription_id"
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    @click="copy(organization.billing.subscription_id)"
                  />
                </dd>
              </div>
            </dl>
          </section>

          <section class="panel compact danger-panel">
            <div class="panel-heading">
              <div>
                <h2>Access controls</h2>
                <p>Use only during support or security incidents.</p>
              </div>
            </div>
            <v-btn
              block
              color="warning"
              variant="tonal"
              prepend-icon="mdi-account-cancel-outline"
              :loading="supporting"
              @click="revokeCredentials('scim')"
              >Revoke SCIM tokens</v-btn
            ><v-btn
              block
              color="error"
              variant="tonal"
              prepend-icon="mdi-key-remove"
              :loading="supporting"
              @click="revokeCredentials('all')"
              >Revoke all API credentials</v-btn
            >
          </section>

          <section class="panel compact">
            <div class="panel-heading">
              <div>
                <h2>Webhook health</h2>
                <p>Latest integration delivery status.</p>
              </div>
            </div>
            <div v-if="organization.webhooks.length" class="webhook-list">
              <div v-for="hook in organization.webhooks" :key="hook.id">
                <v-icon
                  :color="
                    hook.last_delivery_error
                      ? 'error'
                      : hook.is_active
                        ? 'success'
                        : 'secondary'
                  "
                  :icon="
                    hook.last_delivery_error
                      ? 'mdi-alert-circle'
                      : hook.is_active
                        ? 'mdi-check-circle'
                        : 'mdi-pause-circle'
                  "
                  size="18"
                />
                <div>
                  <strong>{{ hook.name }}</strong
                  ><span>{{ webhookDescription(hook) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              No webhook subscriptions configured.
            </div>
          </section>
        </aside>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import axios from "@/plugins/axios";
import { platformHeaders } from "@/composables/PlatformConsole/usePlatformAuth";

const route = useRoute();
const loading = ref(false);
const organization = ref<any>(null);
const saving = ref(false);
const creatingCheckout = ref(false);
const supporting = ref(false);
const reconciling = ref(false);
const operations = ref<any>({
  plan_code: "growth",
  subscription_status: "trialing",
  trial_ends_at: "",
  current_period_ends_at: "",
  employee_limit: "",
});
const plans = [
  { title: "Starter", value: "starter" },
  { title: "Growth", value: "growth" },
  { title: "Business", value: "business" },
  { title: "Enterprise", value: "enterprise" },
  { title: "Basic (legacy)", value: "basic" },
];
const statuses = [
  { title: "Trialing", value: "trialing" },
  { title: "Active", value: "active" },
  { title: "Past due", value: "past_due" },
  { title: "Suspended", value: "suspended" },
  { title: "Cancelled", value: "cancelled" },
];
const checkoutEligible = computed(() =>
  ["starter", "growth", "business"].includes(operations.value.plan_code),
);
const usageMessage = computed(() =>
  organization.value?.usage?.percentage === null
    ? "No employee cap"
    : `${Math.round(organization.value.usage.percentage)}% of capacity`,
);
const label = (value: string) =>
  String(value ?? "")
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
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not set";
const shortDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not set";
const localDateTime = (value?: string) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";
const eventDescription = (event: any) =>
  event.reference
    ? `${event.source} / ${event.reference}`
    : `${event.from_plan_code ?? "No plan"} to ${event.to_plan_code ?? "No plan"}`;
const webhookDescription = (hook: any) =>
  hook.last_delivery_error ||
  `${(hook.event_types ?? []).join(", ") || "No events"} / ${hook.last_delivered_at ? `Delivered ${date(hook.last_delivered_at)}` : "Awaiting first delivery"}`;
const load = async () => {
  loading.value = true;
  try {
    organization.value = (
      await axios.get(`/platform/organizations/${route.params.id}`, {
        headers: platformHeaders(),
      })
    ).data.data;
    operations.value = {
      plan_code: organization.value.plan_code,
      subscription_status: organization.value.subscription_status,
      trial_ends_at: localDateTime(organization.value.trial_ends_at),
      current_period_ends_at: localDateTime(
        organization.value.current_period_ends_at,
      ),
      employee_limit: organization.value.usage.employee_limit ?? "",
    };
  } finally {
    loading.value = false;
  }
};
const saveSubscription = async () => {
  saving.value = true;
  try {
    await axios.patch(
      `/platform/organizations/${route.params.id}/subscription`,
      {
        ...operations.value,
        trial_ends_at: operations.value.trial_ends_at
          ? new Date(operations.value.trial_ends_at).toISOString()
          : null,
        current_period_ends_at: operations.value.current_period_ends_at
          ? new Date(operations.value.current_period_ends_at).toISOString()
          : null,
        employee_limit: operations.value.employee_limit
          ? Number(operations.value.employee_limit)
          : null,
      },
      { headers: platformHeaders() },
    );
    await load();
  } finally {
    saving.value = false;
  }
};
const createCheckout = async () => {
  creatingCheckout.value = true;
  try {
    const base = window.location.origin;
    const response = await axios.post(
      `/platform/organizations/${route.params.id}/checkout-sessions`,
      {
        plan_code: operations.value.plan_code,
        billing_interval: "month",
        success_url: `${base}/platform/organizations/${route.params.id}`,
        cancel_url: `${base}/platform/organizations/${route.params.id}`,
      },
      { headers: platformHeaders() },
    );
    const url = response.data.data?.url;
    if (url) window.open(url, "_blank", "noopener");
  } finally {
    creatingCheckout.value = false;
  }
};
const setOrganizationStatus = async (status: string) => {
  if (
    !window.confirm(
      `Are you sure you want to ${status === "active" ? "reactivate" : "suspend"} this organization?`,
    )
  )
    return;
  supporting.value = true;
  try {
    await axios.patch(
      `/platform/organizations/${route.params.id}/status`,
      { status },
      { headers: platformHeaders() },
    );
    await load();
  } finally {
    supporting.value = false;
  }
};
const revokeCredentials = async (scope: string) => {
  if (
    !window.confirm(
      `Revoke ${scope === "all" ? "all API and SCIM" : "SCIM"} credentials? Existing integrations will stop immediately.`,
    )
  )
    return;
  supporting.value = true;
  try {
    await axios.post(
      `/platform/organizations/${route.params.id}/credentials/revoke`,
      { scope },
      { headers: platformHeaders() },
    );
    await load();
  } finally {
    supporting.value = false;
  }
};
const reconcileSubscription = async () => {
  reconciling.value = true;
  try {
    await axios.post(
      `/platform/organizations/${route.params.id}/subscription/reconcile`,
      {},
      { headers: platformHeaders() },
    );
    await load();
  } finally {
    reconciling.value = false;
  }
};
const copy = async (value?: string) => {
  if (value) await navigator.clipboard.writeText(value);
};
onMounted(load);
</script>

<style scoped>
.console-page {
  max-width: 1500px;
  margin: 0 auto;
  padding: 30px 32px;
}
.breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 18px;
  color: #69758a;
  text-decoration: none;
  font-size: 0.8rem;
}
.organization-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.organization-identity {
  display: flex;
  align-items: center;
  gap: 15px;
}
.org-avatar {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #6576ff, #7356d9);
  font-weight: 800;
}
.organization-header h1 {
  font-size: 1.6rem;
  letter-spacing: -0.035em;
}
.organization-header p {
  margin-top: 3px;
  color: #7e899d;
  font-size: 0.8rem;
}
.header-actions {
  display: flex;
  gap: 9px;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 24px;
}
.metric-grid article {
  display: flex;
  gap: 12px;
  padding: 18px;
  border: 1px solid #e4e8f0;
  border-radius: 13px;
  background: #fff;
}
.metric-icon {
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 10px;
}
.metric-icon.blue {
  color: #5267e8;
  background: #eef0ff;
}
.metric-icon.purple {
  color: #8653d3;
  background: #f4edff;
}
.metric-icon.green {
  color: #169c63;
  background: #e9f8f1;
}
.metric-icon.orange {
  color: #d17a16;
  background: #fff3e4;
}
.metric-grid article > div:last-child {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.metric-grid span {
  font-size: 0.68rem;
  color: #8993a5;
}
.metric-grid strong {
  overflow: hidden;
  font-size: 0.9rem;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.metric-grid small {
  font-size: 0.66rem;
  color: #9aa3b3;
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(300px, 0.75fr);
  gap: 18px;
  margin-top: 18px;
}
.primary-column,
.secondary-column {
  display: grid;
  align-content: start;
  gap: 18px;
}
.panel {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel-raised);
  color: var(--text);
}
.panel.compact {
  padding: 21px;
}
.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 21px;
  padding-bottom: 17px;
  border-bottom: 1px solid var(--line);
}
.panel-heading h2 {
  font-size: 0.96rem;
  color: var(--text);
}
.panel-heading p {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.74rem;
}
.panel-heading > .v-icon {
  color: var(--text-faint);
}
.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.detail-list {
  display: grid;
  gap: 0;
}
.detail-list > div {
  padding: 12px 0;
  border-bottom: 1px solid var(--line-soft);
}
.detail-list > div:last-child {
  border: 0;
}
.detail-list dt {
  font-size: 0.68rem;
  color: var(--text-muted);
}
.detail-list dd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  margin: 4px 0 0;
  font-size: 0.8rem;
  word-break: break-all;
}
.danger-panel > .v-btn + .v-btn {
  margin-top: 9px;
}
.timeline {
  display: grid;
}
.timeline-item {
  display: flex;
  gap: 13px;
  padding: 7px 0 18px;
}
.timeline-marker {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  color: #5d6fdf;
  background: #eef0ff;
}
.timeline-item > div:last-child {
  display: flex;
  flex-direction: column;
}
.timeline-item strong {
  font-size: 0.82rem;
}
.timeline-item p {
  margin-top: 2px;
  color: #657186;
  font-size: 0.74rem;
}
.timeline-item span {
  margin-top: 3px;
  color: #9aa3b3;
  font-size: 0.67rem;
}
.webhook-list {
  display: grid;
  gap: 12px;
}
.webhook-list > div {
  display: flex;
  gap: 10px;
}
.webhook-list > div > div {
  display: flex;
  flex-direction: column;
}
.webhook-list strong {
  font-size: 0.76rem;
}
.webhook-list span {
  font-size: 0.68rem;
  color: #8b95a8;
}
.empty-state {
  padding: 30px;
  text-align: center;
  color: #8c96a8;
  font-size: 0.8rem;
}
.empty-state.small {
  padding: 15px;
}
@media (max-width: 1150px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 650px) {
  .console-page {
    padding: 22px 14px;
  }
  .organization-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions .v-btn {
    flex: 1;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
  .panel {
    padding: 18px;
  }
}
</style>
