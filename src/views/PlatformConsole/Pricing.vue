<template>
  <v-container class="console-page" fluid>
    <!-- Page Heading -->
    <div class="page-heading">
      <div>
        <div class="eyebrow">Billing & Plan Governance</div>
        <h1>Pricing settings</h1>
        <p>
          Configure Free Basic seat allowances, monthly growth rates, and manage
          billing version history for all tenants.
        </p>
      </div>
      <div class="d-flex align-center ga-2">
        <v-chip
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-currency-php"
        >
          Philippines · PHP
        </v-chip>
        <v-btn
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="loadData"
        >
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Alert Notification -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-6"
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <!-- Key Metrics Strip -->
    <div class="pricing-summary-grid">
      <article class="summary-metric-card">
        <div class="metric-icon-box gold">
          <v-icon icon="mdi-account-group" size="20" />
        </div>
        <div>
          <span class="metric-label">Free Seat Allowance</span>
          <strong class="metric-value">{{ allowance }} employees</strong>
          <small class="metric-hint">Included with Free Basic workspace</small>
        </div>
      </article>

      <article class="summary-metric-card">
        <div class="metric-icon-box green">
          <v-icon icon="mdi-tag-text" size="20" />
        </div>
        <div>
          <span class="metric-label">Growth Rate / Seat</span>
          <strong class="metric-value">{{ formatPhp(rate) }} / month</strong>
          <small class="metric-hint"
            >Billed per employee above free allowance</small
          >
        </div>
      </article>

      <article class="summary-metric-card">
        <div class="metric-icon-box blue">
          <v-icon icon="mdi-history" size="20" />
        </div>
        <div>
          <span class="metric-label">Recorded Versions</span>
          <strong class="metric-value">{{ history.length }}</strong>
          <small class="metric-hint">Effective rates in billing history</small>
        </div>
      </article>
    </div>

    <v-progress-linear
      v-if="loading && !history.length"
      indeterminate
      class="my-4"
    />

    <!-- Main 2-Column Section -->
    <div v-else class="pricing-layout-grid">
      <!-- Left: Rate Configuration & Preview -->
      <section class="panel pricing-form-panel">
        <div class="panel-heading">
          <div>
            <h2>Rate configuration</h2>
            <p>New customer checkouts immediately adopt these rates.</p>
          </div>
          <v-icon icon="mdi-cash-cog" class="panel-header-icon" />
        </div>

        <v-form class="pricing-form" @submit.prevent="save">
          <div class="fields-grid">
            <v-text-field
              v-model.number="allowance"
              label="Free employee allowance"
              type="number"
              min="0"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-multiple-check-outline"
              hint="Number of free seats before growth billing applies (standard: 10)"
              persistent-hint
            />

            <v-text-field
              v-model.number="rate"
              label="Monthly price per additional employee"
              prefix="₱"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-currency-php"
              hint="Billed monthly for each seat above allowance (standard: ₱19.00)"
              persistent-hint
            />

            <v-text-field
              v-model="effective"
              label="Effective date (local time, optional)"
              type="datetime-local"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-calendar-clock-outline"
              hint="Leave blank to apply immediately upon saving"
              persistent-hint
            />
          </div>

          <!-- Live Calculator Card -->
          <div class="calculator-card">
            <div class="calculator-header">
              <div class="d-flex align-center ga-2">
                <v-icon
                  icon="mdi-calculator-variant-outline"
                  size="18"
                  color="var(--accent)"
                />
                <strong>Live Growth Bill Preview</strong>
              </div>
              <span class="calculator-badge">Interactive Test</span>
            </div>

            <div class="calculator-body">
              <v-text-field
                v-model.number="employees"
                label="Simulated employee count"
                type="number"
                min="1"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-account-search-outline"
                class="sim-input"
              />

              <div class="calc-breakdown">
                <div class="calc-row">
                  <span>Free seats included:</span>
                  <strong
                    >{{ Math.min(employees, allowance) }} seats (₱0.00)</strong
                  >
                </div>
                <div class="calc-row">
                  <span>Billable additional seats:</span>
                  <strong :class="{ 'text-accent': employees > allowance }">
                    {{ Math.max(0, employees - allowance) }} seats
                  </strong>
                </div>
                <v-divider class="my-2" />
                <div class="calc-total-row">
                  <span>Estimated Monthly Charge:</span>
                  <strong class="total-amount">
                    {{ formatPhp(Math.max(0, employees - allowance) * rate)
                    }}<small>/mo</small>
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              size="large"
              block
              :loading="saving"
              prepend-icon="mdi-content-save-check-outline"
            >
              Save pricing version
            </v-btn>
          </div>

          <v-alert
            v-if="saved"
            type="success"
            variant="tonal"
            closable
            class="mt-4"
            @click:close="saved = false"
          >
            Pricing version saved successfully. New checkout sessions will use
            this configuration.
          </v-alert>
        </v-form>
      </section>

      <!-- Right: Version History -->
      <section class="panel pricing-history-panel">
        <div class="panel-heading">
          <div>
            <h2>Version history</h2>
            <p>Historical and scheduled pricing adjustments.</p>
          </div>
          <v-chip size="small" variant="tonal" color="primary">
            {{ history.length }}
            {{ history.length === 1 ? "version" : "versions" }}
          </v-chip>
        </div>

        <div v-if="!history.length" class="empty-history">
          <v-icon icon="mdi-history" size="36" color="var(--text-faint)" />
          <p>No pricing changes recorded yet.</p>
          <span>The application defaults to 10 free seats and ₱19/seat.</span>
        </div>

        <div v-else class="history-table-wrapper">
          <v-table class="console-table" hover>
            <thead>
              <tr>
                <th>Effective Date</th>
                <th>Free Allowance</th>
                <th>Monthly Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in history" :key="item.version ?? index">
                <td>
                  <div class="d-flex align-center ga-2">
                    <v-icon
                      icon="mdi-clock-outline"
                      size="14"
                      color="var(--text-faint)"
                    />
                    <span class="font-weight-medium">
                      {{
                        new Date(item.effective_at).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="seat-pill"
                    >{{ item.free_employee_limit }} seats</span
                  >
                </td>
                <td>
                  <strong class="rate-text">{{
                    formatPhp(item.growth_price_per_employee / 100)
                  }}</strong>
                  <span class="text-caption text-grey"> / seat</span>
                </td>
                <td>
                  <v-chip
                    v-if="new Date(item.effective_at) <= new Date()"
                    size="x-small"
                    color="success"
                    variant="tonal"
                  >
                    Active
                  </v-chip>
                  <v-chip v-else size="x-small" color="warning" variant="tonal">
                    Scheduled
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </section>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  fetchPricing,
  fetchPricingHistory,
  savePricing,
} from "@/composables/PlatformConsole/usePlatformPricing";
import { formatPhp } from "@/utils/growthPricing";

const allowance = ref(10);
const rate = ref(19);
const employees = ref(25);
const effective = ref("");
const error = ref("");
const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const history = ref<any[]>([]);

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [pricing, versions] = await Promise.all([
      fetchPricing(),
      fetchPricingHistory(),
    ]);
    allowance.value = pricing.free_employee_limit;
    rate.value = pricing.growth_price_per_employee / 100;
    history.value = versions;
  } catch {
    error.value =
      "Could not load pricing settings. Please refresh to try again.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

async function save() {
  saving.value = true;
  saved.value = false;
  error.value = "";
  try {
    await savePricing({
      free_employee_limit: allowance.value,
      growth_price_per_employee: Math.round(rate.value * 100),
      currency: "php",
      ...(effective.value
        ? { effective_at: new Date(effective.value).toISOString() }
        : {}),
    });
    history.value = await fetchPricingHistory();
    saved.value = true;
  } catch (e: any) {
    error.value =
      Object.values(e.response?.data?.errors ?? {})
        .flat()
        .join(" ") || "Could not save pricing configuration.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.console-page {
  padding: 28px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 4px;
}

.page-heading h1 {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
  color: var(--text);
}

.page-heading p {
  font-size: 0.86rem;
  color: var(--text-muted);
  margin: 0;
  max-width: 720px;
}

/* Summary Grid */
.pricing-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--panel-raised);
  border: 1px solid var(--line);
  border-radius: 12px;
  border-radius: 0 !important;
}

.metric-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border-radius: 0 !important;
  flex-shrink: 0;
}

.metric-icon-box.gold {
  background: var(--accent-soft);
  color: var(--accent-strong);
  border: 1px solid rgba(201, 154, 75, 0.3);
}

.metric-icon-box.green {
  background: var(--signal-soft);
  color: var(--signal);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.metric-icon-box.blue {
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.metric-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  margin-bottom: 2px;
}

.metric-value {
  display: block;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.metric-hint {
  display: block;
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 2-Column Layout */
.pricing-layout-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
  align-items: start;
}

.panel {
  background: var(--panel-raised);
  border: 1px solid var(--line);
  border-radius: 14px;
  border-radius: 0 !important;
  padding: 24px;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}

.panel-heading h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
}

.panel-heading p {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.panel-header-icon {
  color: var(--accent);
}

/* Form Styles */
.fields-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.calculator-card {
  margin-top: 20px;
  margin-bottom: 24px;
  padding: 16px 18px;
  border-radius: 10px;
  border-radius: 0 !important;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid var(--line);
}

.calculator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  font-size: 0.85rem;
}

.calculator-badge {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 6px;
  border-radius: 0 !important;
  background: var(--accent-soft);
  color: var(--accent-strong);
  border: 1px solid rgba(201, 154, 75, 0.3);
}

.calculator-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sim-input {
  max-width: 240px;
}

.calc-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calc-row strong {
  color: var(--text);
}

.text-accent {
  color: var(--accent-strong) !important;
}

.calc-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.calc-total-row span {
  color: var(--text);
  font-weight: 600;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--accent-strong);
}

.total-amount small {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
}

.form-actions {
  margin-top: 8px;
}

/* History Styles */
.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
  gap: 8px;
}

.empty-history p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.empty-history span {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.history-table-wrapper {
  overflow-x: auto;
}

.console-table {
  background: transparent !important;
  color: var(--text) !important;
}

.console-table th {
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
  color: var(--text-faint) !important;
  background: rgba(0, 0, 0, 0.2) !important;
  border-bottom: 1px solid var(--line) !important;
  padding: 12px 14px !important;
}

.console-table td {
  padding: 14px !important;
  border-bottom: 1px solid var(--line-soft) !important;
  font-size: 0.84rem !important;
}

.seat-pill {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  border-radius: 0 !important;
  background: var(--line-soft);
  border: 1px solid var(--line);
  color: var(--text);
}

.rate-text {
  color: var(--accent-strong);
  font-size: 0.92rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .pricing-layout-grid {
    grid-template-columns: 1fr;
  }
  .pricing-summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .console-page {
    padding: 18px 14px;
  }
  .page-heading {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
