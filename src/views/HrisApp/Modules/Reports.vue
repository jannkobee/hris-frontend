<template>
  <v-container fluid>
    <ModuleHeader
      eyebrow="Workforce intelligence"
      title="Reports"
      subtitle="Run, save, and export operational workforce reports."
      icon="mdi-chart-box-outline"
    >
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-download"
          :disabled="!report"
          @click="exportCsv"
          >Export CSV</v-btn
        >
      </template>
    </ModuleHeader>

    <v-row>
      <v-col cols="12" :md="canManage ? 9 : 12">
        <v-card class="mb-5">
          <v-card-text class="d-flex flex-wrap align-center ga-3">
            <v-select
              v-model="form.report_type"
              :items="types"
              label="Report"
              variant="outlined"
              density="comfortable"
              hide-details
              class="report-type"
            />
            <v-text-field
              v-model="form.from"
              type="date"
              label="From"
              variant="outlined"
              density="comfortable"
              hide-details
              class="report-date"
            />
            <v-text-field
              v-model="form.to"
              type="date"
              label="To"
              variant="outlined"
              density="comfortable"
              hide-details
              class="report-date"
            />
            <v-btn color="primary" :loading="loading" @click="run">
              Run report
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card v-if="report">
          <v-card-title>
            {{ report.title }}
            <v-chip size="small" class="ml-2"
              >{{ report.rows.length }} rows</v-chip
            >
          </v-card-title>
          <v-divider />
          <v-table>
            <thead>
              <tr>
                <th v-for="column in report.columns" :key="column">
                  {{ label(column) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in report.rows" :key="index">
                <td v-for="column in report.columns" :key="column">
                  {{ row[column] ?? "—" }}
                </td>
              </tr>
              <tr v-if="!report.rows.length">
                <td
                  :colspan="report.columns.length"
                  class="text-center text-medium-emphasis py-8"
                >
                  No records found for this period.
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <v-col v-if="canManage" cols="12" md="3">
        <v-card>
          <v-card-title class="text-subtitle-1">Saved reports</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="saveName"
              label="Report name"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-3"
            />
            <v-select
              v-model="deliveryFrequency"
              :items="deliveryFrequencies"
              label="Email schedule (optional)"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              class="mb-3"
            />
            <template v-if="deliveryFrequency">
              <v-text-field
                v-model="deliveryRecipients"
                label="Recipient emails"
                hint="Separate multiple addresses with commas"
                persistent-hint
                variant="outlined"
                density="comfortable"
                class="mb-3"
              />
              <v-text-field
                v-model.number="deliveryPeriodDays"
                type="number"
                min="1"
                max="366"
                label="Report period (days)"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              />
            </template>
            <v-btn
              block
              color="primary"
              variant="tonal"
              prepend-icon="mdi-content-save-outline"
              :disabled="!saveName.trim()"
              :loading="saving"
              @click="save"
            >
              Save current report
            </v-btn>
            <v-divider class="my-4" />

            <v-list v-if="savedReports.length" density="compact">
              <v-list-item
                v-for="item in savedReports"
                :key="item.id"
                :title="item.name"
                :subtitle="savedReportSubtitle(item)"
                @click="loadSaved(item)"
              >
                <template #prepend>
                  <v-icon icon="mdi-file-chart-outline" color="primary" />
                </template>
                <template #append>
                  <v-btn
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    color="error"
                    title="Delete saved report"
                    @click.stop="remove(item)"
                  />
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-caption text-medium-emphasis py-3">
              Save a report configuration for quick reuse.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import { usePermissions } from "@/composables/usePermissions";

type ReportForm = { report_type: string; from: string; to: string };

const { checkPermissions } = usePermissions();
const canManage = computed(() => checkPermissions("manage-reports"));
const today = new Date().toISOString().slice(0, 10);
const form = ref<ReportForm>({
  report_type: "attendance_summary",
  from: `${today.slice(0, 8)}01`,
  to: today,
});
const types = [
  { title: "Attendance summary", value: "attendance_summary" },
  { title: "Leave summary", value: "leave_summary" },
  { title: "Overtime summary", value: "overtime_summary" },
  { title: "Payroll register", value: "payroll_register" },
  { title: "Workforce cost summary", value: "workforce_cost_summary" },
];
const loading = ref(false);
const saving = ref(false);
const report = ref<any>(null);
const savedReports = ref<any[]>([]);
const saveName = ref("");
const deliveryFrequency = ref<string | null>(null);
const deliveryRecipients = ref("");
const deliveryPeriodDays = ref(30);
const deliveryFrequencies = [
  { title: "Daily", value: "daily" },
  { title: "Weekly", value: "weekly" },
  { title: "Monthly", value: "monthly" },
];

const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const reportTypeLabel = (value: string) =>
  types.find((type) => type.value === value)?.title ?? label(value);
const savedReportSubtitle = (item: any) => {
  const range =
    item.filters?.from && item.filters?.to
      ? `${item.filters.from} – ${item.filters.to}`
      : "No date range";
  return `${reportTypeLabel(item.report_type)} · ${range}`;
};

const run = async () => {
  loading.value = true;
  try {
    report.value = (await axios.post("/reports/run", form.value)).data.data;
  } finally {
    loading.value = false;
  }
};

const loadSavedReports = async () => {
  if (!canManage.value) return;
  savedReports.value = (await axios.get("/reports/saved")).data.data ?? [];
};

const loadSaved = async (item: any) => {
  form.value = {
    report_type: item.report_type,
    from: item.filters?.from ?? form.value.from,
    to: item.filters?.to ?? form.value.to,
  };
  await run();
};

const save = async () => {
  saving.value = true;
  try {
    await axios.post("/reports/saved", {
      name: saveName.value.trim(),
      report_type: form.value.report_type,
      filters: { from: form.value.from, to: form.value.to },
      delivery_frequency: deliveryFrequency.value,
      delivery_period_days: deliveryFrequency.value
        ? deliveryPeriodDays.value
        : undefined,
      delivery_recipients: deliveryFrequency.value
        ? deliveryRecipients.value
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean)
        : undefined,
    });
    saveName.value = "";
    deliveryFrequency.value = null;
    deliveryRecipients.value = "";
    await loadSavedReports();
  } finally {
    saving.value = false;
  }
};

const remove = async (item: any) => {
  await axios.delete(`/reports/saved/${item.id}`);
  await loadSavedReports();
};

const exportCsv = async () => {
  const response = await axios.post("/reports/export", form.value, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${form.value.report_type}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(loadSavedReports);
</script>

<style scoped>
.report-type {
  min-width: 230px;
  max-width: 290px;
}
.report-date {
  max-width: 190px;
}
</style>
