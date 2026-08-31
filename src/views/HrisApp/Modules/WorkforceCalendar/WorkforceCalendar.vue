<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :read-only="action === 'View'"
    :visible="isFormVisible"
    :form="emptyForm"
    :data="formData"
    :fields="fields"
    @close="closeForm"
    @execute="execute"
  />

  <v-dialog v-model="importDialog" max-width="620" :persistent="importing">
    <v-card class="holiday-import" rounded="lg">
      <header class="holiday-import__header">
        <div class="holiday-import__icon">
          <v-icon
            :icon="importResult ? 'mdi-check' : 'mdi-cloud-download-outline'"
            size="25"
          />
        </div>
        <div>
          <span>{{ importResult ? "Import complete" : "Calendar tools" }}</span>
          <h2>
            {{
              importResult
                ? `${importResult.year} holidays updated`
                : "Import public holidays"
            }}
          </h2>
          <p>
            {{
              importResult
                ? "Your workforce calendar has been refreshed."
                : "Add the official public holidays for your organization country."
            }}
          </p>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          :disabled="importing"
          aria-label="Close holiday import"
          @click="closeImportDialog"
        />
      </header>

      <v-card-text v-if="!importResult" class="holiday-import__body">
        <div class="import-source">
          <div>
            <span>Organization country</span
            ><strong>{{ organizationCountry }}</strong
            ><small>Inherited from organization settings</small>
          </div>
          <v-icon icon="mdi-arrow-right" color="medium-emphasis" />
          <div>
            <span>Calendar year</span
            ><v-select
              v-model="importYear"
              :items="yearOptions"
              variant="outlined"
              density="compact"
              hide-details
              aria-label="Holiday import year"
            />
          </div>
        </div>
        <v-alert type="info" variant="tonal" density="compact" class="mt-5"
          >Holiday data will be requested for
          <strong>{{ organizationCountry }}</strong> in
          <strong>{{ importYear }}</strong
          >.</v-alert
        >
        <section class="import-behavior">
          <h3>What will happen</h3>
          <div>
            <v-icon icon="mdi-plus-circle-outline" color="success" /><span
              >Missing public holidays will be added as regular holidays.</span
            >
          </div>
          <div>
            <v-icon icon="mdi-shield-check-outline" color="info" /><span
              >Existing dates and manually created entries will be
              preserved.</span
            >
          </div>
          <div>
            <v-icon icon="mdi-skip-next-circle-outline" color="warning" /><span
              >Dates already on the calendar will be skipped
              automatically.</span
            >
          </div>
        </section>
      </v-card-text>

      <v-card-text v-else class="holiday-import__result">
        <div class="result-metric result-metric--success">
          <span>Imported</span><strong>{{ importResult.imported }}</strong
          ><small>New calendar entries</small>
        </div>
        <div class="result-metric">
          <span>Skipped</span><strong>{{ importResult.skipped }}</strong
          ><small>Dates already present</small>
        </div>
        <div class="result-summary">
          <v-icon icon="mdi-calendar-check-outline" color="primary" />
          <p>
            The {{ importResult.year }} calendar for
            {{ importResult.countryCode }} is ready. Imported entries can still
            be reviewed and edited individually.
          </p>
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="holiday-import__actions">
        <template v-if="!importResult"
          ><v-btn
            variant="text"
            :disabled="importing"
            @click="closeImportDialog"
            >Cancel</v-btn
          ><v-btn
            color="primary"
            prepend-icon="mdi-cloud-download-outline"
            :loading="importing"
            @click="importHolidays"
            >Import {{ importYear }} holidays</v-btn
          ></template
        >
        <template v-else
          ><v-btn variant="text" @click="resetImport">Import another year</v-btn
          ><v-btn color="primary" @click="closeImportDialog"
            >View calendar</v-btn
          ></template
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-container class="workforce-calendar" fluid>
    <ModuleHeader
      eyebrow="Workforce planning"
      title="Workforce Calendar"
      subtitle="Maintain the official holidays and working-day exceptions used across HR."
      icon="mdi-calendar-star"
    >
      <template #actions>
        <div class="calendar-overview__period">
          <span>Calendar year</span>
          <strong>{{ selectedYear || "All years" }}</strong>
        </div>
      </template>
    </ModuleHeader>

    <section class="calendar-metrics" aria-label="Workforce calendar summary">
      <article class="calendar-metric">
        <div class="calendar-metric__icon">
          <v-icon icon="mdi-calendar-check-outline" />
        </div>
        <div>
          <span>Calendar entries</span
          ><strong>{{ summaryEntries.length }}</strong>
        </div>
      </article>
      <article class="calendar-metric">
        <div class="calendar-metric__icon calendar-metric__icon--warning">
          <v-icon icon="mdi-calendar-remove-outline" />
        </div>
        <div>
          <span>Non-working days</span><strong>{{ nonWorkingCount }}</strong>
        </div>
      </article>
      <article class="calendar-metric">
        <div class="calendar-metric__icon calendar-metric__icon--info">
          <v-icon icon="mdi-briefcase-clock-outline" />
        </div>
        <div>
          <span>Working exceptions</span
          ><strong>{{ workingExceptionCount }}</strong>
        </div>
      </article>
      <article class="calendar-metric calendar-metric--next">
        <div class="calendar-metric__icon calendar-metric__icon--success">
          <v-icon icon="mdi-calendar-arrow-right" />
        </div>
        <div>
          <span>Next entry</span><strong>{{ nextEntryLabel }}</strong>
        </div>
      </article>
    </section>

    <Table
      :entity="entity"
      title="Company Calendar"
      subtitle="One official day classification per date keeps attendance and payroll rules consistent."
      icon="mdi-calendar-month-outline"
      :headers="fields"
      :data="items"
      :loading="loading"
      :pagination="pagination"
      search-placeholder="Search calendar entries..."
      empty-title="No calendar entries"
      empty-text="Add a holiday or change the selected filters."
      @filter="loadEntries"
      @create="create"
      @view="view"
      @edit="edit"
      @remove="remove"
    >
      <template #toolbar-actions>
        <v-btn
          v-if="canManageHolidays"
          variant="tonal"
          color="secondary"
          prepend-icon="mdi-cloud-download-outline"
          class="text-none"
          @click="openImportDialog"
          >Import public holidays</v-btn
        >
      </template>
      <template #filters>
        <v-select
          v-model="selectedType"
          class="calendar-filter"
          :items="holidayTypeOptions"
          item-title="label"
          item-value="value"
          label="Day type"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="refreshFilters"
        />
        <v-select
          v-model="selectedYear"
          class="calendar-filter calendar-filter--year"
          :items="yearOptions"
          label="Year"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="refreshYear"
        />
      </template>
    </Table>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import Form from "@/components/Form.vue";
import Table from "@/components/Table.vue";
import { useApi } from "@/composables/useApi";
import { usePermissions } from "@/composables/usePermissions";
import { useAuth } from "@/composables/useAuth";
import { fields, holidayTypeOptions } from "@/fields/holiday";
import { formatDate } from "@/utils/dateFormatter";

type Holiday = {
  id: string;
  name: string;
  date: string;
  type: string;
  description?: string | null;
};
type HolidayImportResult = {
  imported: number;
  skipped: number;
  countryCode: string;
  year: number;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from(
  { length: 9 },
  (_, index) => currentYear - 3 + index,
);
const selectedYear = ref<number | null>(currentYear);
const selectedType = ref<string | null>(null);
const importDialog = ref(false);
const importing = ref(false);
const importYear = ref(currentYear);
const importResult = ref<HolidayImportResult | null>(null);
const { checkPermissions } = usePermissions();
const { authUser } = useAuth();
const organizationCountry = computed(
  () => authUser.value?.organization?.country_code?.toUpperCase() || "PH",
);
const canManageHolidays = computed(() => checkPermissions("manage-holidays"));
const lastTableOptions = ref<Record<string, unknown>>({ page: 1, limit: 10 });
const summaryEntries = ref<Holiday[]>([]);
const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi<Holiday>("/holidays");

const entity = "Holiday";
const action = ref("");
const isFormVisible = ref(false);
const formData = ref<Holiday | Record<string, unknown>>({});
const emptyForm = {
  id: "",
  name: "",
  date: "",
  type: "regular_holiday",
  description: "",
};

const nonWorkingCount = computed(
  () =>
    summaryEntries.value.filter((entry) => entry.type !== "special_working_day")
      .length,
);
const workingExceptionCount = computed(
  () =>
    summaryEntries.value.filter((entry) => entry.type === "special_working_day")
      .length,
);
const nextEntry = computed(() => {
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return [...summaryEntries.value]
    .filter((entry) => entry.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
});
const nextEntryLabel = computed(() =>
  nextEntry.value
    ? `${nextEntry.value.name} · ${formatDate(nextEntry.value.date)}`
    : "None scheduled",
);

const requestFilters = () => ({
  year: selectedYear.value || undefined,
  type: selectedType.value || undefined,
});

const loadEntries = async (options: Record<string, unknown> = {}) => {
  lastTableOptions.value = { ...lastTableOptions.value, ...options };
  await index({ ...lastTableOptions.value, ...requestFilters() });
};

const loadSummary = async () => {
  const response = await axios.get("/holidays", {
    params: { all: 1, year: selectedYear.value || undefined },
  });
  summaryEntries.value = Array.isArray(response.data?.data)
    ? response.data.data
    : [];
};

const refreshFilters = async () => {
  lastTableOptions.value.page = 1;
  await loadEntries();
};
const refreshYear = async () => {
  await Promise.all([refreshFilters(), loadSummary()]);
};
const openImportDialog = () => {
  importYear.value = selectedYear.value || currentYear;
  importResult.value = null;
  importDialog.value = true;
};
const closeImportDialog = () => {
  if (!importing.value) importDialog.value = false;
};
const resetImport = () => {
  importResult.value = null;
};
const importHolidays = async () => {
  importing.value = true;
  try {
    const response = await axios.post("/holidays/import", {
      year: importYear.value,
    });
    importResult.value = response.data.data as HolidayImportResult;
    selectedYear.value = importYear.value;
    await Promise.all([loadEntries(), loadSummary()]);
  } finally {
    importing.value = false;
  }
};
const create = () => {
  action.value = "Create";
  formData.value = { ...emptyForm };
  isFormVisible.value = true;
};
const view = (entry: Holiday) => {
  action.value = "View";
  formData.value = entry;
  isFormVisible.value = true;
};
const edit = (entry: Holiday) => {
  action.value = "Edit";
  formData.value = { ...entry };
  isFormVisible.value = true;
};
const remove = (entry: Holiday) => {
  action.value = "Remove";
  formData.value = entry;
  isFormVisible.value = true;
};
const closeForm = () => {
  isFormVisible.value = false;
};

const execute = async (payload: Holiday) => {
  if (action.value === "Create") await store(payload);
  if (action.value === "Edit") await update(payload.id, payload);
  if (action.value === "Remove") await destroy(payload.id);
  isFormVisible.value = false;
  await Promise.all([loadEntries(), loadSummary()]);
};

onMounted(async () => {
  await Promise.all([loadEntries(), loadSummary()]);
});
</script>

<style scoped>
.workforce-calendar {
  display: grid;
  gap: 16px;
}
.calendar-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.1),
    rgba(var(--v-theme-surface), 0.96)
  );
}
.calendar-overview__copy {
  display: flex;
  align-items: center;
  gap: 14px;
}
.calendar-overview__icon,
.calendar-metric__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
}
.calendar-overview__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
}
.calendar-overview h1 {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.25;
}
.calendar-overview p {
  margin: 4px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.66);
  font-size: 0.86rem;
}
.calendar-overview__period {
  display: grid;
  min-width: 120px;
  padding-left: 18px;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  text-align: right;
}
.calendar-overview__period span,
.calendar-metric span {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.72rem;
}
.calendar-overview__period strong {
  font-size: 1.05rem;
}
.calendar-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.calendar-metric {
  display: flex;
  min-height: 88px;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}
.calendar-metric__icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
}
.calendar-metric__icon--warning {
  color: rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.12);
}
.calendar-metric__icon--info {
  color: rgb(var(--v-theme-info));
  background: rgba(var(--v-theme-info), 0.12);
}
.calendar-metric__icon--success {
  color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.12);
}
.calendar-metric div:last-child {
  display: grid;
  min-width: 0;
}
.calendar-metric strong {
  overflow: hidden;
  font-size: 1.15rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.calendar-metric--next strong {
  font-size: 0.82rem;
}
.calendar-filter {
  width: 230px;
  max-width: 100%;
}
.calendar-filter--year {
  width: 130px;
}
.holiday-import {
  overflow: hidden;
}
.holiday-import__header {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 22px 24px 18px;
}
.holiday-import__header > div:nth-child(2) {
  min-width: 0;
}
.holiday-import__header span {
  color: rgb(var(--v-theme-primary));
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.holiday-import__header h2 {
  margin: 2px 0 0;
  font-size: 1.2rem;
}
.holiday-import__header p {
  margin: 3px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.8rem;
}
.holiday-import__icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 13px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
}
.holiday-import__body {
  padding: 12px 24px 24px !important;
}
.import-source {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.import-source > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.import-source span,
.result-metric span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.import-source strong {
  margin-top: 4px;
  font-size: 1.2rem;
}
.import-source small,
.result-metric small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.68rem;
}
.import-behavior {
  display: grid;
  gap: 11px;
  margin-top: 22px;
}
.import-behavior h3 {
  margin-bottom: 2px;
  font-size: 0.82rem;
}
.import-behavior > div {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.79rem;
}
.holiday-import__result {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 12px 24px 26px !important;
}
.result-metric {
  display: flex;
  flex-direction: column;
  padding: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.result-metric strong {
  margin: 2px 0;
  font-size: 1.8rem;
  line-height: 1.1;
}
.result-metric--success {
  border-color: rgba(var(--v-theme-success), 0.3);
  background: rgba(var(--v-theme-success), 0.08);
}
.result-summary {
  display: flex;
  grid-column: 1 / -1;
  align-items: flex-start;
  gap: 11px;
  margin-top: 4px;
  padding: 15px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.07);
}
.result-summary p {
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.78rem;
  line-height: 1.5;
}
.holiday-import__actions {
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px !important;
}
@media (max-width: 1100px) {
  .calendar-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 650px) {
  .calendar-overview {
    align-items: flex-start;
    flex-direction: column;
  }
  .calendar-overview__period {
    padding-left: 0;
    border-left: 0;
    text-align: left;
  }
  .calendar-metrics {
    grid-template-columns: 1fr;
  }
  .calendar-filter,
  .calendar-filter--year {
    width: 100%;
  }
  .import-source {
    grid-template-columns: 1fr;
  }
  .import-source > .v-icon {
    display: none;
  }
  .holiday-import__result {
    grid-template-columns: 1fr;
  }
  .result-summary {
    grid-column: auto;
  }
  .holiday-import__actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
  .holiday-import__actions .v-btn {
    width: 100%;
  }
}
</style>
