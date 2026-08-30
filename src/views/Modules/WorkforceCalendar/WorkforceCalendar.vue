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

  <v-dialog v-model="importDialog" max-width="460">
    <v-card>
      <v-card-title>Import public holidays</v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">Existing calendar entries are preserved; matching dates will be skipped.</p>
        <v-text-field v-model="importCountry" label="Country code" hint="ISO 3166-1 alpha-2, e.g. PH" persistent-hint variant="outlined" />
        <v-select v-model="importYear" :items="yearOptions" label="Year" variant="outlined" />
      </v-card-text>
      <v-card-actions><v-spacer /><v-btn @click="importDialog = false">Cancel</v-btn><v-btn color="primary" :loading="importing" @click="importHolidays">Import holidays</v-btn></v-card-actions>
    </v-card>
  </v-dialog>

  <v-container class="workforce-calendar" fluid>
    <section class="calendar-overview">
      <div class="calendar-overview__copy">
        <div class="calendar-overview__icon"><v-icon icon="mdi-calendar-star" size="25" /></div>
        <div>
          <h1>Workforce Calendar</h1>
          <p>Maintain the official holidays and working-day exceptions used across HR.</p>
        </div>
      </div>
      <div class="calendar-overview__period">
        <span>Calendar year</span>
        <strong>{{ selectedYear || "All years" }}</strong>
      </div>
      <v-btn v-if="canManageHolidays" color="primary" variant="flat" prepend-icon="mdi-download" @click="importDialog = true">Import holidays</v-btn>
    </section>

    <section class="calendar-metrics" aria-label="Workforce calendar summary">
      <article class="calendar-metric">
        <div class="calendar-metric__icon"><v-icon icon="mdi-calendar-check-outline" /></div>
        <div><span>Calendar entries</span><strong>{{ summaryEntries.length }}</strong></div>
      </article>
      <article class="calendar-metric">
        <div class="calendar-metric__icon calendar-metric__icon--warning"><v-icon icon="mdi-calendar-remove-outline" /></div>
        <div><span>Non-working days</span><strong>{{ nonWorkingCount }}</strong></div>
      </article>
      <article class="calendar-metric">
        <div class="calendar-metric__icon calendar-metric__icon--info"><v-icon icon="mdi-briefcase-clock-outline" /></div>
        <div><span>Working exceptions</span><strong>{{ workingExceptionCount }}</strong></div>
      </article>
      <article class="calendar-metric calendar-metric--next">
        <div class="calendar-metric__icon calendar-metric__icon--success"><v-icon icon="mdi-calendar-arrow-right" /></div>
        <div><span>Next entry</span><strong>{{ nextEntryLabel }}</strong></div>
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
import { fields, holidayTypeOptions } from "@/fields/holiday";
import { formatDate } from "@/utils/dateFormatter";

type Holiday = { id: string; name: string; date: string; type: string; description?: string | null };

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 9 }, (_, index) => currentYear - 3 + index);
const selectedYear = ref<number | null>(currentYear);
const selectedType = ref<string | null>(null);
const importDialog = ref(false);
const importing = ref(false);
const importCountry = ref("PH");
const importYear = ref(currentYear);
const { checkPermissions } = usePermissions();
const canManageHolidays = computed(() => checkPermissions("manage-holidays"));
const lastTableOptions = ref<Record<string, unknown>>({ page: 1, limit: 10 });
const summaryEntries = ref<Holiday[]>([]);
const { index, items, loading, loadingActions, pagination, store, update, destroy } = useApi<Holiday>("/holidays");

const entity = "Holiday";
const action = ref("");
const isFormVisible = ref(false);
const formData = ref<Holiday | Record<string, unknown>>({});
const emptyForm = { id: "", name: "", date: "", type: "regular_holiday", description: "" };

const nonWorkingCount = computed(() => summaryEntries.value.filter((entry) => entry.type !== "special_working_day").length);
const workingExceptionCount = computed(() => summaryEntries.value.filter((entry) => entry.type === "special_working_day").length);
const nextEntry = computed(() => {
  const today = new Date();
  const todayKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  return [...summaryEntries.value].filter((entry) => entry.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date))[0];
});
const nextEntryLabel = computed(() => nextEntry.value ? `${nextEntry.value.name} · ${formatDate(nextEntry.value.date)}` : "None scheduled");

const requestFilters = () => ({ year: selectedYear.value || undefined, type: selectedType.value || undefined });

const loadEntries = async (options: Record<string, unknown> = {}) => {
  lastTableOptions.value = { ...lastTableOptions.value, ...options };
  await index({ ...lastTableOptions.value, ...requestFilters() });
};

const loadSummary = async () => {
  const response = await axios.get("/holidays", { params: { all: 1, year: selectedYear.value || undefined } });
  summaryEntries.value = Array.isArray(response.data?.data) ? response.data.data : [];
};

const refreshFilters = async () => { lastTableOptions.value.page = 1; await loadEntries(); };
const refreshYear = async () => { await Promise.all([refreshFilters(), loadSummary()]); };
const importHolidays = async () => {
  importing.value = true;
  try {
    await axios.post("/holidays/import", { year: importYear.value, country_code: importCountry.value.toUpperCase() });
    importDialog.value = false;
    selectedYear.value = importYear.value;
    await Promise.all([loadEntries(), loadSummary()]);
  } finally { importing.value = false; }
};
const create = () => { action.value = "Create"; formData.value = { ...emptyForm }; isFormVisible.value = true; };
const view = (entry: Holiday) => { action.value = "View"; formData.value = entry; isFormVisible.value = true; };
const edit = (entry: Holiday) => { action.value = "Edit"; formData.value = { ...entry }; isFormVisible.value = true; };
const remove = (entry: Holiday) => { action.value = "Remove"; formData.value = entry; isFormVisible.value = true; };
const closeForm = () => { isFormVisible.value = false; };

const execute = async (payload: Holiday) => {
  if (action.value === "Create") await store(payload);
  if (action.value === "Edit") await update(payload.id, payload);
  if (action.value === "Remove") await destroy(payload.id);
  isFormVisible.value = false;
  await Promise.all([loadEntries(), loadSummary()]);
};

onMounted(async () => { await Promise.all([loadEntries(), loadSummary()]); });
</script>

<style scoped>
.workforce-calendar { display: grid; gap: 16px; }
.calendar-overview { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 20px 22px; border: 1px solid rgba(var(--v-theme-primary), 0.2); border-radius: 16px; background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-surface), 0.96)); }
.calendar-overview__copy { display: flex; align-items: center; gap: 14px; }
.calendar-overview__icon, .calendar-metric__icon { display: grid; flex: 0 0 auto; place-items: center; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.12); }
.calendar-overview__icon { width: 48px; height: 48px; border-radius: 14px; }
.calendar-overview h1 { margin: 0; font-size: 1.4rem; line-height: 1.25; }
.calendar-overview p { margin: 4px 0 0; color: rgba(var(--v-theme-on-surface), 0.66); font-size: 0.86rem; }
.calendar-overview__period { display: grid; min-width: 120px; padding-left: 18px; border-left: 1px solid rgba(var(--v-theme-on-surface), 0.12); text-align: right; }
.calendar-overview__period span, .calendar-metric span { color: rgba(var(--v-theme-on-surface), 0.62); font-size: 0.72rem; }
.calendar-overview__period strong { font-size: 1.05rem; }
.calendar-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.calendar-metric { display: flex; min-height: 88px; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid rgba(var(--v-theme-on-surface), 0.09); border-radius: 14px; background: rgb(var(--v-theme-surface)); }
.calendar-metric__icon { width: 38px; height: 38px; border-radius: 11px; }
.calendar-metric__icon--warning { color: rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), 0.12); }
.calendar-metric__icon--info { color: rgb(var(--v-theme-info)); background: rgba(var(--v-theme-info), 0.12); }
.calendar-metric__icon--success { color: rgb(var(--v-theme-success)); background: rgba(var(--v-theme-success), 0.12); }
.calendar-metric div:last-child { display: grid; min-width: 0; }
.calendar-metric strong { overflow: hidden; font-size: 1.15rem; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.calendar-metric--next strong { font-size: 0.82rem; }
.calendar-filter { width: 230px; max-width: 100%; }
.calendar-filter--year { width: 130px; }
@media (max-width: 1100px) { .calendar-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 650px) { .calendar-overview { align-items: flex-start; flex-direction: column; } .calendar-overview__period { padding-left: 0; border-left: 0; text-align: left; } .calendar-metrics { grid-template-columns: 1fr; } .calendar-filter, .calendar-filter--year { width: 100%; } }
</style>
