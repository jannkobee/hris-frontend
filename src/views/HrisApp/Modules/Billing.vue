<template>
  <v-container fluid class="pa-0">
    <ModuleHeader
      eyebrow="Organization administration"
      title="Billing & subscription"
      subtitle="Transparent per-employee pricing, bill previews, and subscription controls."
      icon="mdi-credit-card-outline"
    >
      <template #actions>
        <v-btn
          v-if="summary?.has_stripe_customer"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-open-in-new"
          :loading="openingPortal"
          @click="openPortal"
        >
          Customer Portal
        </v-btn>
      </template>
    </ModuleHeader>

    <!-- Error Alert -->
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-5"
      closable
    >
      {{ errorMessage }}
    </v-alert>

    <!-- Past Due Alert Banner -->
    <v-alert
      v-if="summary?.subscription_status === 'past_due'"
      type="warning"
      variant="tonal"
      class="mb-5"
    >
      <div class="d-flex align-center justify-between flex-wrap ga-3">
        <div>
          <strong>Payment required</strong>
          <div>
            Your latest subscription invoice failed to process. You are in the
            7-day grace window. Update your payment method to prevent workspace
            disruption.
          </div>
        </div>
        <v-btn
          color="warning"
          variant="flat"
          size="small"
          :loading="openingPortal"
          @click="openPortal"
        >
          Update Payment Method
        </v-btn>
      </div>
    </v-alert>

    <!-- Loading Skeleton -->
    <v-row v-if="loading">
      <v-col cols="12" md="6">
        <v-skeleton-loader type="article" />
      </v-col>
      <v-col cols="12" md="6">
        <v-skeleton-loader type="article" />
      </v-col>
    </v-row>

    <!-- Main Billing Content -->
    <div v-else-if="summary">
      <v-row>
        <!-- Plan & Quota Card -->
        <v-col cols="12" md="6">
          <v-card class="billing-card" variant="outlined" rounded="lg">
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-4">
                <div>
                  <span class="text-caption text-medium-emphasis"
                    >Current Plan</span
                  >
                  <h3 class="text-h6 font-weight-bold">
                    {{ summary.plan_name }}
                  </h3>
                </div>
                <v-chip
                  :color="statusColor(summary.subscription_status)"
                  size="small"
                  variant="tonal"
                  class="font-weight-medium"
                >
                  {{ statusLabel(summary.subscription_status) }}
                </v-chip>
              </div>

              <!-- Employee Quota Progress Meter -->
              <div class="quota-meter mb-4">
                <div class="d-flex justify-space-between text-body-2 mb-1">
                  <span>Active employees</span>
                  <span class="font-weight-bold">
                    {{ summary.active_employee_count }}
                    <template v-if="summary.plan_code === 'basic_free'">
                      / {{ summary.free_employee_limit }} included
                    </template>
                  </span>
                </div>
                <v-progress-linear
                  :model-value="quotaPercentage"
                  :color="quotaPercentage >= 100 ? 'warning' : 'primary'"
                  height="8"
                  rounded
                />
                <div class="text-caption text-medium-emphasis mt-1">
                  <template v-if="summary.plan_code === 'basic_free'">
                    {{
                      Math.max(
                        0,
                        summary.free_employee_limit -
                          summary.active_employee_count,
                      )
                    }}
                    free seats remaining.
                  </template>
                  <template v-else>
                    First {{ summary.free_employee_limit }} places free ·
                    {{ summary.billable_employee_count }} billed at
                    {{ formatRate }}/mo.
                  </template>
                </div>
              </div>

              <v-divider class="my-3" />

              <div class="billing-meta-list text-body-2">
                <div class="meta-row">
                  <span class="text-medium-emphasis">Billing Interval</span>
                  <span>{{
                    summary.current_period_ends_at
                      ? "Monthly subscription"
                      : "No expiry (Free Forever)"
                  }}</span>
                </div>
                <div v-if="summary.current_period_ends_at" class="meta-row">
                  <span class="text-medium-emphasis">Next Renewal</span>
                  <span>{{
                    new Date(
                      summary.current_period_ends_at,
                    ).toLocaleDateString()
                  }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Bill Preview & Breakdown Card -->
        <v-col cols="12" md="6">
          <v-card class="billing-card" variant="outlined" rounded="lg">
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-4">
                <div>
                  <span class="text-caption text-medium-emphasis"
                    >Billing Breakdown</span
                  >
                  <h3 class="text-h6 font-weight-bold">
                    Estimated Monthly Bill
                  </h3>
                </div>
                <div class="text-h5 font-weight-bold text-primary">
                  {{ formatPhp(summary.monthly_amount / 100) }}
                  <span
                    class="text-caption text-medium-emphasis font-weight-regular"
                    >/mo</span
                  >
                </div>
              </div>

              <div class="price-breakdown mb-4">
                <div class="breakdown-item">
                  <span
                    >First {{ summary.free_employee_limit }} active
                    employees</span
                  >
                  <span class="font-weight-medium text-success">₱0 (Free)</span>
                </div>
                <div class="breakdown-item">
                  <span
                    >Additional employees ({{
                      summary.billable_employee_count
                    }}
                    × {{ formatRate }})</span
                  >
                  <span class="font-weight-medium">{{
                    formatPhp(summary.monthly_amount / 100)
                  }}</span>
                </div>
                <v-divider class="my-2" />
                <div class="breakdown-item font-weight-bold">
                  <span>Total monthly recurring</span>
                  <span>{{ formatPhp(summary.monthly_amount / 100) }}</span>
                </div>
              </div>

              <!-- Action Button -->
              <div v-if="summary.plan_code === 'basic_free'" class="mt-4">
                <v-btn
                  color="primary"
                  block
                  size="large"
                  prepend-icon="mdi-rocket-launch-outline"
                  :loading="upgrading"
                  @click="initiateGrowthCheckout"
                >
                  Upgrade to Growth Plan
                </v-btn>
                <div class="text-caption text-center text-medium-emphasis mt-2">
                  Unlocks unlimited employees, reports, shift rosters, and
                  document vaults.
                </div>
              </div>
              <div v-else class="mt-4">
                <v-btn
                  color="primary"
                  variant="tonal"
                  block
                  prepend-icon="mdi-open-in-new"
                  :loading="openingPortal"
                  @click="openPortal"
                >
                  Manage Invoices & Payment Card
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Interactive Team Growth Estimator -->
      <v-row class="mt-2">
        <v-col cols="12">
          <v-card class="calculator-card" variant="outlined" rounded="lg">
            <v-card-text>
              <h4 class="text-subtitle-1 font-weight-bold mb-1">
                Project Your Monthly Cost
              </h4>
              <p class="text-body-2 text-medium-emphasis mb-4">
                See how affordable LexisOne Growth is as your team grows. Your
                first 10 employees stay free.
              </p>

              <v-row align="center">
                <v-col cols="12" md="6">
                  <v-slider
                    v-model="simulatedEmployees"
                    :min="1"
                    :max="150"
                    :step="1"
                    color="primary"
                    track-color="surface-variant"
                    hide-details
                  >
                    <template #append>
                      <v-text-field
                        v-model.number="simulatedEmployees"
                        type="number"
                        min="1"
                        max="500"
                        density="compact"
                        style="width: 100px"
                        hide-details
                        variant="outlined"
                      />
                    </template>
                  </v-slider>
                </v-col>
                <v-col cols="12" md="6" class="text-md-right">
                  <div class="simulated-result">
                    <span class="text-caption text-medium-emphasis">
                      {{
                        Math.max(
                          summary.minimum_billable_employees ?? 0,
                          simulatedEmployees - summary.free_employee_limit,
                        )
                      }}
                      billable seats
                    </span>
                    <div class="text-h4 font-weight-bold text-primary">
                      {{
                        formatPhp(
                          Math.max(
                            summary.minimum_billable_employees ?? 0,
                            simulatedEmployees - summary.free_employee_limit,
                          ) *
                            (summary.growth_price_per_employee / 100),
                        )
                      }}
                      <span
                        class="text-body-2 font-weight-regular text-medium-emphasis"
                        >/month</span
                      >
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ModuleHeader from "@/components/layouts/HrisApp/ModuleHeader.vue";
import axiosRequest from "@/plugins/axios";
import { formatPhp } from "@/utils/growthPricing";

interface BillingSummary {
  plan_code: string;
  plan_name: string;
  subscription_status: string;
  trial_ends_at?: string;
  current_period_ends_at?: string;
  billing_provider?: string;
  billing_customer_id?: string;
  billing_subscription_id?: string;
  has_stripe_customer?: boolean;
  active_employee_count: number;
  free_employee_limit: number;
  minimum_billable_employees: number;
  billable_employee_count: number;
  growth_price_per_employee: number;
  growth_currency: string;
  monthly_amount: number;
}

const loading = ref(true);
const summary = ref<BillingSummary | null>(null);
const errorMessage = ref("");
const openingPortal = ref(false);
const upgrading = ref(false);
const simulatedEmployees = ref(15);

const quotaPercentage = computed(() => {
  if (!summary.value) return 0;
  if (summary.value.plan_code !== "basic_free") return 100;
  return Math.min(
    100,
    Math.round(
      (summary.value.active_employee_count /
        summary.value.free_employee_limit) *
        100,
    ),
  );
});

const formatRate = computed(() => {
  if (!summary.value) return "₱19";
  return formatPhp(summary.value.growth_price_per_employee / 100);
});

const statusColor = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "past_due":
      return "warning";
    case "canceled":
    case "suspended":
      return "error";
    default:
      return "info";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Active";
    case "past_due":
      return "Past Due";
    case "canceled":
      return "Canceled";
    case "suspended":
      return "Suspended";
    case "trialing":
      return "Trial";
    default:
      return status;
  }
};

const loadSummary = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await axiosRequest.get("/billing/summary");
    summary.value = response.data?.data;
    if (summary.value) {
      summary.value.has_stripe_customer = Boolean(
        summary.value.billing_customer_id,
      );
      simulatedEmployees.value = Math.max(
        15,
        summary.value.active_employee_count + 5,
      );
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Unable to load billing information.";
  } finally {
    loading.value = false;
  }
};

const initiateGrowthCheckout = async () => {
  upgrading.value = true;
  errorMessage.value = "";
  try {
    const response = await axiosRequest.post("/billing/checkout-sessions", {
      plan_code: "growth",
      billing_interval: "month",
      success_url: `${window.location.origin}/billing`,
      cancel_url: `${window.location.origin}/billing`,
    });
    const url = response.data?.data?.url;
    if (!url) {
      throw new Error("Stripe checkout did not return a valid session link.");
    }
    window.location.assign(url);
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session. Please try again.";
  } finally {
    upgrading.value = false;
  }
};

const openPortal = async () => {
  openingPortal.value = true;
  errorMessage.value = "";
  try {
    const response = await axiosRequest.post("/billing/portal-sessions", {
      return_url: `${window.location.origin}/billing`,
    });
    const url = response.data?.data?.url;
    if (!url) {
      throw new Error("The billing provider did not return a portal link.");
    }
    window.location.assign(url);
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Unable to open the billing portal. Please verify your payment details.";
  } finally {
    openingPortal.value = false;
  }
};

onMounted(() => {
  loadSummary();
});
</script>

<style scoped>
.billing-card,
.calculator-card {
  height: 100%;
  border-color: rgba(var(--v-border-color), 0.12);
}

.price-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
  padding: 14px;
  border-radius: 8px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.88rem;
}

.billing-meta-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
}

.simulated-result {
  display: flex;
  flex-direction: column;
}
</style>
