<template>
  <v-container fluid class="payroll-page">
    <ModuleHeader
      eyebrow="Compensation workspace"
      :title="canViewCompany ? 'Payroll' : 'My payslips'"
      :subtitle="
        canViewCompany
          ? 'Process, approve, and track employee compensation.'
          : 'View your processed payroll and payment history.'
      "
      icon="mdi-cash-multiple"
    />

    <div v-if="canViewCompany" class="summary-grid mb-5">
      <div class="summary-card">
        <v-icon icon="mdi-calendar-clock" color="primary" /><span>Periods</span
        ><strong>{{ pagination.total }}</strong>
      </div>
      <div class="summary-card">
        <v-icon icon="mdi-bank-transfer-out" color="success" /><span
          >Page net payroll</span
        ><strong>{{ money(pageNet) }}</strong>
      </div>
      <div class="summary-card">
        <v-icon icon="mdi-check-decagram-outline" color="info" /><span
          >Awaiting approval</span
        ><strong>{{ processedCount }}</strong>
      </div>
    </div>

    <Table
      entity="Payroll"
      title="Payroll periods"
      subtitle="Select a period to open its payslips and review its totals."
      icon="mdi-calendar-cash-outline"
      search-placeholder="Search payroll periods..."
      empty-title="No payroll periods found"
      empty-text="Create a payroll period or adjust your search."
      :headers="headers"
      :data="periods"
      :pagination="pagination"
      :loading="loading"
      :items-per-page-options="[10, 20, 50]"
      :show-create-action="false"
      :show-view-action="false"
      :show-edit-action="false"
      :show-delete-action="false"
      @filter="load"
    >
      <template #toolbar-actions>
        <v-btn
          v-if="canManage"
          color="success"
          prepend-icon="mdi-calendar-plus"
          variant="flat"
          class="text-none"
          @click="openCreate"
        >
          New payroll period
        </v-btn>
      </template>
      <template #extra-actions="{ item }">
        <v-btn
          class="app-table__icon-action"
          icon="mdi-eye-outline"
          size="small"
          density="comfortable"
          variant="tonal"
          color="primary"
          title="View payslips"
          aria-label="View payslips"
          @click="openPeriod(item)"
        />
        <v-btn
          v-if="canManage && ['draft', 'processed'].includes(item.status)"
          class="app-table__icon-action"
          icon="mdi-calculator-variant-outline"
          size="small"
          density="comfortable"
          variant="tonal"
          color="info"
          :title="
            item.status === 'draft' ? 'Generate payroll' : 'Regenerate payroll'
          "
          :aria-label="
            item.status === 'draft' ? 'Generate payroll' : 'Regenerate payroll'
          "
          :loading="actingId === item.id"
          @click="processPeriod(item)"
        />
        <v-btn
          v-if="canApprove && item.status === 'processed'"
          class="app-table__icon-action"
          icon="mdi-check-circle-outline"
          size="small"
          density="comfortable"
          variant="tonal"
          color="success"
          title="Approve payroll"
          aria-label="Approve payroll"
          :loading="actingId === item.id"
          @click="approvePeriod(item)"
        />
        <v-btn
          v-if="canApprove && item.status === 'approved' && !item.locked_at"
          class="app-table__icon-action"
          icon="mdi-lock-outline"
          size="small"
          density="comfortable"
          variant="tonal"
          color="warning"
          title="Lock payroll"
          aria-label="Lock payroll"
          :loading="actingId === item.id"
          @click="lockPeriod(item)"
        />
        <v-btn
          v-if="canMarkPaid && item.status === 'approved' && item.locked_at"
          class="app-table__icon-action"
          icon="mdi-bank-check"
          size="small"
          density="comfortable"
          variant="tonal"
          color="primary"
          title="Mark paid"
          aria-label="Mark paid"
          :loading="actingId === item.id"
          @click="markPaid(item)"
        />
        <v-btn
          v-if="canManage && item.status === 'draft'"
          class="app-table__icon-action"
          icon="mdi-delete-outline"
          size="small"
          density="comfortable"
          variant="tonal"
          color="error"
          title="Remove draft"
          aria-label="Remove draft"
          @click="removePeriod(item)"
        />
      </template>
    </Table>

    <v-dialog v-model="createDialog" max-width="610">
      <v-card rounded="xl">
        <v-card-title class="dialog-heading"
          ><v-avatar color="primary" variant="tonal" size="38"
            ><v-icon icon="mdi-calendar-plus"
          /></v-avatar>
          <div>
            <strong>New payroll period</strong
            ><small>Create a non-overlapping pay cycle.</small>
          </div>
          <v-spacer /><v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="createDialog = false"
        /></v-card-title>
        <v-card-text class="form-grid pa-5">
          <v-text-field
            v-model="periodForm.name"
            label="Period name"
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="span-2"
          />
          <v-text-field
            v-model="periodForm.date_from"
            type="date"
            label="Start date"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <v-text-field
            v-model="periodForm.date_to"
            type="date"
            label="End date"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <v-text-field
            v-model="periodForm.payout_date"
            type="date"
            label="Payout date"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <v-select
            v-model="periodForm.frequency"
            label="Frequency"
            :items="frequencyOptions"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
        </v-card-text>
        <v-card-actions class="px-5 pb-5"
          ><v-spacer /><v-btn
            variant="text"
            class="text-none"
            @click="createDialog = false"
            >Cancel</v-btn
          ><v-btn
            color="success"
            class="text-none"
            :loading="saving"
            :disabled="!validPeriodForm"
            @click="createPeriod"
            >Create period</v-btn
          ></v-card-actions
        >
      </v-card>
    </v-dialog>

    <v-dialog v-model="periodDialog" max-width="1180" scrollable>
      <v-card rounded="xl">
        <v-card-title class="dialog-heading">
          <v-avatar color="primary" variant="tonal" size="40"
            ><v-icon icon="mdi-receipt-text-check-outline"
          /></v-avatar>
          <div>
            <strong>{{ selectedPeriod?.name }}</strong
            ><small
              >{{ date(selectedPeriod?.date_from) }} –
              {{ date(selectedPeriod?.date_to) }} · Pay date
              {{ date(selectedPeriod?.payout_date) }}</small
            >
          </div>
          <v-spacer /><v-chip
            :color="statusColor(selectedPeriod?.status)"
            variant="tonal"
            size="small"
            class="text-capitalize mr-2"
            >{{ selectedPeriod?.status }}</v-chip
          >
          <v-chip
            v-if="selectedPeriod?.locked_at"
            color="warning"
            variant="tonal"
            size="small"
            prepend-icon="mdi-lock"
            >Locked</v-chip
          >
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="periodDialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <div v-if="canViewCompany" class="period-toolbar mb-4">
            <div class="period-totals">
              <span>{{ selectedPeriod?.items?.length ?? 0 }} employees</span>
              <strong
                >{{ money(selectedPeriod?.total_net) }} net payroll</strong
              >
            </div>
            <div class="d-flex flex-wrap justify-end ga-2">
              <v-btn
                v-if="
                  canManage &&
                  ['draft', 'processed'].includes(selectedPeriod?.status)
                "
                color="primary"
                variant="tonal"
                prepend-icon="mdi-calculator-variant-outline"
                class="text-none"
                :loading="actingId === selectedPeriod?.id"
                @click="processPeriod(selectedPeriod)"
                >{{
                  selectedPeriod?.status === "draft"
                    ? "Generate payroll"
                    : "Regenerate"
                }}</v-btn
              >
              <v-btn
                v-if="selectedPeriod?.items?.length"
                variant="tonal"
                prepend-icon="mdi-file-delimited-outline"
                class="text-none"
                @click="exportCsv"
                >Export CSV</v-btn
              >
              <v-btn
                v-if="selectedPeriod?.items?.length"
                variant="tonal"
                prepend-icon="mdi-printer-outline"
                class="text-none"
                @click="printRegister"
                >Print / PDF</v-btn
              >
              <v-btn
                v-if="canApprove && selectedPeriod?.status === 'processed'"
                color="primary"
                prepend-icon="mdi-check-decagram-outline"
                class="text-none"
                :disabled="unacknowledgedExceptionCount > 0"
                :loading="actingId === selectedPeriod?.id"
                @click="approvePeriod(selectedPeriod)"
                >Approve</v-btn
              >
              <v-btn
                v-if="
                  canApprove &&
                  selectedPeriod?.status === 'approved' &&
                  !selectedPeriod?.locked_at
                "
                color="warning"
                variant="tonal"
                prepend-icon="mdi-lock-outline"
                class="text-none"
                :loading="actingId === selectedPeriod?.id"
                @click="lockPeriod(selectedPeriod)"
                >Lock payroll</v-btn
              >
              <v-btn
                v-if="
                  canMarkPaid &&
                  selectedPeriod?.status === 'approved' &&
                  selectedPeriod?.locked_at
                "
                color="primary"
                prepend-icon="mdi-bank-check"
                class="text-none"
                :loading="actingId === selectedPeriod?.id"
                @click="markPaid(selectedPeriod)"
                >Mark paid</v-btn
              >
            </div>
          </div>
          <div
            v-if="unacknowledgedExceptionCount"
            class="exception-banner mb-4"
          >
            <v-icon icon="mdi-alert-outline" color="warning" />
            <div>
              <strong
                >{{ unacknowledgedExceptionCount }} payslip{{
                  unacknowledgedExceptionCount === 1 ? "" : "s"
                }}
                need review</strong
              ><span
                >Missing or incomplete attendance must be reviewed before this
                payroll can be approved.</span
              >
            </div>
            <v-btn
              v-if="canManage && selectedPeriod?.status === 'processed'"
              color="warning"
              variant="tonal"
              size="small"
              class="text-none"
              :loading="acknowledging"
              @click="acknowledgeAll"
              >Acknowledge all</v-btn
            >
          </div>
          <div v-if="selectedPeriod?.items?.length" class="payslip-list">
            <article
              v-for="item in selectedPeriod.items"
              :key="item.id"
              class="payslip-row"
            >
              <v-avatar color="primary" variant="tonal">{{
                item.employee?.user?.initials
              }}</v-avatar>
              <div class="employee-copy">
                <strong>{{ item.employee?.user?.full_name }}</strong
                ><small>{{ item.employee?.employee_no }}</small>
              </div>
              <div class="work-summary">
                <span>{{ number(item.days_worked) }} worked</span
                ><small
                  >{{ number(item.paid_leave_days) }} paid leave Â·
                  {{ number(item.absent_days) }} absent</small
                ><v-chip
                  v-if="item.exceptions?.length"
                  size="x-small"
                  :color="
                    item.exceptions_acknowledged_at ? 'default' : 'warning'
                  "
                  variant="tonal"
                  >{{ item.exceptions.length }} exception{{
                    item.exceptions.length === 1 ? "" : "s"
                  }}</v-chip
                >
              </div>
              <div class="pay-metric">
                <span>Gross</span><strong>{{ money(item.gross_pay) }}</strong>
              </div>
              <div class="pay-metric">
                <span>Deductions</span
                ><strong>{{ money(item.total_deductions) }}</strong>
              </div>
              <div class="pay-metric pay-metric--net">
                <span>Net pay</span><strong>{{ money(item.net_pay) }}</strong>
              </div>
              <v-btn
                icon="mdi-receipt-text-outline"
                variant="tonal"
                color="primary"
                size="small"
                title="View payslip"
                @click="openPayslip(item)"
              />
              <v-btn
                v-if="canManage && selectedPeriod.status === 'processed'"
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                title="Adjust payslip"
                @click="openAdjustment(item)"
              />
            </article>
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-calculator-variant-outline" size="44" /><strong
              >No payslips processed</strong
            ><span v-if="canManage && selectedPeriod?.status === 'draft'"
              >Process this draft to calculate employees with matching pay
              schedules.</span
            >
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="payslipDialog" max-width="720">
      <v-card rounded="xl" class="payslip-detail">
        <v-card-title class="dialog-heading"
          ><v-avatar color="primary" variant="tonal" size="40"
            ><v-icon icon="mdi-receipt-text-outline"
          /></v-avatar>
          <div>
            <strong>Payslip</strong
            ><small
              >{{ payslip?.employee?.user?.full_name }} ·
              {{ selectedPeriod?.name }}</small
            >
          </div>
          <v-spacer /><v-btn
            icon="mdi-printer-outline"
            variant="text"
            size="small"
            title="Print"
            @click="printPayslip" /><v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="payslipDialog = false"
        /></v-card-title>
        <v-divider />
        <v-card-text class="pa-5" id="printable-payslip">
          <div class="work-summary-card">
            <div>
              <span>Scheduled</span
              ><strong>{{ number(payslip?.scheduled_days) }} days</strong>
            </div>
            <div>
              <span>Worked</span
              ><strong>{{ number(payslip?.days_worked) }} days</strong>
            </div>
            <div>
              <span>Paid leave</span
              ><strong>{{ number(payslip?.paid_leave_days) }} days</strong>
            </div>
            <div>
              <span>Unpaid leave</span
              ><strong>{{ number(payslip?.unpaid_leave_days) }} days</strong>
            </div>
            <div>
              <span>Absent</span
              ><strong>{{ number(payslip?.absent_days) }} days</strong>
            </div>
            <div>
              <span>Late / undertime</span
              ><strong
                >{{
                  Number(payslip?.late_minutes || 0) +
                  Number(payslip?.undertime_minutes || 0)
                }}
                min</strong
              >
            </div>
          </div>
          <div v-if="payslip?.exceptions?.length" class="payslip-exceptions">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-alert-outline" color="warning" /><strong
                >Payroll exceptions</strong
              ><v-chip
                v-if="payslip?.exceptions_acknowledged_at"
                size="x-small"
                color="success"
                variant="tonal"
                >Acknowledged</v-chip
              >
            </div>
            <ul>
              <li v-for="(exception, index) in payslip.exceptions" :key="index">
                {{ exception.message }}
              </li>
            </ul>
            <v-btn
              v-if="
                canManage &&
                selectedPeriod?.status === 'processed' &&
                !payslip?.exceptions_acknowledged_at
              "
              color="warning"
              variant="tonal"
              size="small"
              class="text-none align-self-start no-print"
              :loading="acknowledging"
              @click="acknowledgeItem(payslip)"
              >Acknowledge exception</v-btn
            >
          </div>
          <div class="payslip-columns">
            <div>
              <h3>Earnings</h3>
              <div class="amount-line">
                <span>Basic pay</span
                ><strong>{{ money(payslip?.basic_pay) }}</strong>
              </div>
              <div class="amount-line">
                <span>Overtime</span
                ><strong>{{ money(payslip?.overtime_pay) }}</strong>
              </div>
              <div class="amount-line">
                <span>Allowances</span
                ><strong>{{ money(payslip?.allowances) }}</strong>
              </div>
              <div class="amount-line">
                <span>Other earnings</span
                ><strong>{{ money(payslip?.other_earnings) }}</strong>
              </div>
              <div class="amount-line amount-line--total">
                <span>Gross pay</span
                ><strong>{{ money(payslip?.gross_pay) }}</strong>
              </div>
            </div>
            <div>
              <h3>Deductions</h3>
              <div class="amount-line">
                <span>Absences</span
                ><strong>{{ money(payslip?.absence_deduction) }}</strong>
              </div>
              <div class="amount-line">
                <span>Late / undertime</span
                ><strong>{{ money(payslip?.late_undertime_deduction) }}</strong>
              </div>
              <div class="amount-line">
                <span>Unpaid leave</span
                ><strong>{{ money(payslip?.unpaid_leave_deduction) }}</strong>
              </div>
              <div class="amount-line">
                <span>SSS</span
                ><strong>{{ money(payslip?.sss_employee) }}</strong>
              </div>
              <div class="amount-line">
                <span>PhilHealth</span
                ><strong>{{ money(payslip?.philhealth_employee) }}</strong>
              </div>
              <div class="amount-line">
                <span>Pag-IBIG</span
                ><strong>{{ money(payslip?.pagibig_employee) }}</strong>
              </div>
              <div class="amount-line">
                <span>Withholding tax</span
                ><strong>{{ money(payslip?.withholding_tax) }}</strong>
              </div>
              <div class="amount-line">
                <span>Other deductions</span
                ><strong>{{ money(payslip?.other_deductions) }}</strong>
              </div>
              <div class="amount-line amount-line--total">
                <span>Total deductions</span
                ><strong>{{ money(payslip?.total_deductions) }}</strong>
              </div>
            </div>
          </div>
          <div class="net-pay">
            <span>Net pay</span><strong>{{ money(payslip?.net_pay) }}</strong>
          </div>
          <div v-if="payslip?.notes" class="payslip-note">
            <strong>Notes</strong><span>{{ payslip.notes }}</span>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="adjustDialog" max-width="580">
      <v-card rounded="xl"
        ><v-card-title class="dialog-heading"
          ><v-avatar color="primary" variant="tonal" size="38"
            ><v-icon icon="mdi-cash-edit"
          /></v-avatar>
          <div>
            <strong>Adjust payslip</strong
            ><small>{{ adjustmentItem?.employee?.user?.full_name }}</small>
          </div>
          <v-spacer /><v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="adjustDialog = false" /></v-card-title
        ><v-card-text class="form-grid pa-5"
          ><v-text-field
            v-model.number="adjustForm.allowances"
            type="number"
            min="0"
            label="Allowances"
            prefix="₱"
            density="compact"
            variant="outlined"
            hide-details="auto" /><v-text-field
            v-model.number="adjustForm.other_earnings"
            type="number"
            min="0"
            label="Other earnings"
            prefix="₱"
            density="compact"
            variant="outlined"
            hide-details="auto" /><v-text-field
            v-model.number="adjustForm.other_deductions"
            type="number"
            min="0"
            label="Other deductions"
            prefix="₱"
            density="compact"
            variant="outlined"
            hide-details="auto" /><v-textarea
            v-model="adjustForm.notes"
            label="Notes"
            rows="2"
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="span-2" /></v-card-text
        ><v-card-actions class="px-5 pb-5"
          ><v-spacer /><v-btn
            variant="text"
            class="text-none"
            @click="adjustDialog = false"
            >Cancel</v-btn
          ><v-btn
            color="primary"
            class="text-none"
            :loading="saving"
            @click="saveAdjustment"
            >Recalculate payslip</v-btn
          ></v-card-actions
        ></v-card
      >
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import axios from "@/plugins/axios";
import Table from "@/components/Table.vue";
import type { ColumnConfig } from "@/types/types";
import { usePermissions } from "@/composables/usePermissions";
import { useAppSettings } from "@/composables/useAppSettings";
import { formatDate as date } from "@/utils/dateFormatter";
import { useAppDialog } from "@/composables/useAppDialog";

const { checkPermissions } = usePermissions();
const { values } = useAppSettings();
const canViewCompany = computed(() => checkPermissions("view-payroll"));
const canManage = computed(() => checkPermissions("manage-payroll"));
const canApprove = computed(() => checkPermissions("approve-payroll"));
const canMarkPaid = computed(() => checkPermissions("mark-payroll-paid"));
const { confirm } = useAppDialog();
const periods = ref<any[]>([]);
const pagination = ref({ total: 0, page: 1, itemsPerPage: 10 });
const loading = ref(false);
const saving = ref(false);
const acknowledging = ref(false);
const actingId = ref<string | null>(null);
const search = ref("");
const createDialog = ref(false);
const periodDialog = ref(false);
const payslipDialog = ref(false);
const adjustDialog = ref(false);
const selectedPeriod = ref<any>();
const payslip = ref<any>();
const adjustmentItem = ref<any>();
const periodForm = ref({
  name: "",
  date_from: "",
  date_to: "",
  payout_date: "",
  frequency: "semi_monthly",
});
const adjustForm = ref({
  allowances: 0,
  other_earnings: 0,
  other_deductions: 0,
  notes: "",
});
const frequencyOptions = [
  { title: "Semi-monthly", value: "semi_monthly" },
  { title: "Monthly", value: "monthly" },
];
const headers = computed<ColumnConfig[]>(() => [
  { title: "Period", key: "name" },
  {
    title: "Coverage",
    key: "date_from",
    sortable: false,
    formatter: (_value, item) =>
      `${date(item.date_from)} – ${date(item.date_to)}`,
  },
  { title: "Pay date", key: "payout_date", inputField: "date" },
  {
    title: "Frequency",
    key: "frequency",
    displayAs: "chip",
    chipColor: "info",
    inputOptions: frequencyOptions.map(({ title, value }) => ({
      label: title,
      value,
    })),
  },
  { title: "Status", key: "status", displayAs: "chip", chipColor: statusColor },
  ...(canViewCompany.value
    ? [
        { title: "Employees", key: "items_count", align: "center" as const },
        {
          title: "Net payroll",
          key: "total_net",
          align: "end" as const,
          formatter: money,
        },
      ]
    : []),
  {
    title: "Action",
    key: "action",
    inputField: "none",
    sortable: false,
    align: "center" as const,
  },
]);
const pageNet = computed(() =>
  periods.value.reduce((sum, item) => sum + Number(item.total_net || 0), 0),
);
const processedCount = computed(
  () => periods.value.filter((item) => item.status === "processed").length,
);
const validPeriodForm = computed(() =>
  Object.values(periodForm.value).every(Boolean),
);
const unacknowledgedExceptionCount = computed(
  () =>
    selectedPeriod.value?.items?.filter(
      (item: any) =>
        item.exceptions?.length && !item.exceptions_acknowledged_at,
    ).length ?? 0,
);

const load = async (filters: any = {}) => {
  pagination.value.page = filters.page ?? pagination.value.page;
  pagination.value.itemsPerPage =
    filters.itemsPerPage ?? filters.limit ?? pagination.value.itemsPerPage;
  search.value = filters.search ?? search.value;
  loading.value = true;
  try {
    const response = await axios.get("/payroll-periods", {
      params: {
        page: pagination.value.page,
        limit: pagination.value.itemsPerPage,
        search: search.value,
      },
    });
    periods.value = response.data.data.data ?? [];
    pagination.value.total = response.data.data.total ?? 0;
  } finally {
    loading.value = false;
  }
};
const openCreate = () => {
  periodForm.value = {
    name: "",
    date_from: "",
    date_to: "",
    payout_date: "",
    frequency: values.value["payroll.default_frequency"] ?? "semi_monthly",
  };
  createDialog.value = true;
};
const createPeriod = async () => {
  saving.value = true;
  try {
    await axios.post("/payroll-periods", periodForm.value);
    createDialog.value = false;
    await load();
  } finally {
    saving.value = false;
  }
};
const openPeriod = async (period: any) => {
  const response = await axios.get(`/payroll-periods/${period.id}`);
  selectedPeriod.value = response.data.data;
  periodDialog.value = true;
};
const act = async (period: any, action: string) => {
  actingId.value = period.id;
  try {
    await axios.post(`/payroll-periods/${period.id}/${action}`);
    await load();
    if (periodDialog.value) await openPeriod(period);
  } finally {
    actingId.value = null;
  }
};
const processPeriod = async (period: any) => {
  if (
    period.status === "processed" &&
    !(await confirm({
      title: "Regenerate payroll?",
      message:
        "Manual adjustments are preserved, but attendance, leave, overtime, and statutory amounts will be recalculated.",
      confirmText: "Regenerate",
      tone: "warning",
    }))
  )
    return;
  await act(period, "process");
};
const approvePeriod = (period: any) => act(period, "approve");
const lockPeriod = async (period: any) => {
  if (
    !(await confirm({
      title: "Lock payroll?",
      message:
        "This permanently freezes the payroll calculations and payslip snapshots. Only locked payroll can be marked as paid.",
      confirmText: "Lock payroll",
      tone: "warning",
    }))
  )
    return;
  await act(period, "lock");
};
const markPaid = (period: any) => act(period, "mark-paid");
const removePeriod = async (period: any) => {
  if (
    !(await confirm({
      title: "Remove payroll period?",
      message: `Remove ${period.name}? This cannot be undone.`,
      confirmText: "Remove",
      tone: "error",
    }))
  )
    return;
  await axios.delete(`/payroll-periods/${period.id}`);
  await load();
};
const openPayslip = (item: any) => {
  payslip.value = item;
  payslipDialog.value = true;
};
const openAdjustment = (item: any) => {
  adjustmentItem.value = item;
  adjustForm.value = {
    allowances: Number(item.allowances),
    other_earnings: Number(item.other_earnings),
    other_deductions: Number(item.other_deductions),
    notes: item.notes ?? "",
  };
  adjustDialog.value = true;
};
const saveAdjustment = async () => {
  saving.value = true;
  try {
    await axios.put(
      `/payroll-items/${adjustmentItem.value.id}`,
      adjustForm.value,
    );
    adjustDialog.value = false;
    await openPeriod(selectedPeriod.value);
    await load();
  } finally {
    saving.value = false;
  }
};
const acknowledgeAll = async () => {
  acknowledging.value = true;
  try {
    await axios.post(
      `/payroll-periods/${selectedPeriod.value.id}/acknowledge-exceptions`,
    );
    await openPeriod(selectedPeriod.value);
  } finally {
    acknowledging.value = false;
  }
};
const acknowledgeItem = async (item: any) => {
  acknowledging.value = true;
  try {
    await axios.post(`/payroll-items/${item.id}/acknowledge-exceptions`);
    await openPeriod(selectedPeriod.value);
    payslip.value = selectedPeriod.value.items.find(
      (candidate: any) => candidate.id === item.id,
    );
  } finally {
    acknowledging.value = false;
  }
};
const exportCsv = async () => {
  const response = await axios.get(
    `/payroll-periods/${selectedPeriod.value.id}/export/csv`,
    {
      responseType: "blob",
      headers: { "X-Suppress-Success-Notification": "true" },
    },
  );
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(selectedPeriod.value.name || "payroll")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()}-register.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
const printRegister = () => {
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) return;
  const rows = (selectedPeriod.value.items ?? [])
    .map(
      (item: any) => `<tr>
    <td>${escapeHtml(item.employee?.employee_no)}</td><td>${escapeHtml(item.employee?.user?.full_name)}</td>
    <td>${number(item.days_worked)}</td><td>${number(item.paid_leave_days)}</td><td>${number(item.unpaid_leave_days)}</td><td>${number(item.absent_days)}</td>
    <td>${money(item.gross_pay)}</td><td>${money(item.total_deductions)}</td><td>${money(item.net_pay)}</td>
  </tr>`,
    )
    .join("");
  reportWindow.document
    .write(`<!doctype html><html><head><title>${escapeHtml(selectedPeriod.value.name)} payroll register</title><style>
    body{font:12px Arial,sans-serif;color:#111;padding:28px}h1{margin:0 0 4px;font-size:22px}.meta{color:#555;margin-bottom:22px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:right}th{text-transform:uppercase;font-size:10px;background:#f4f4f4}th:nth-child(-n+2),td:nth-child(-n+2){text-align:left}.totals{display:flex;justify-content:flex-end;gap:28px;margin-top:20px;font-size:14px}.totals strong{display:block;font-size:18px}@page{size:landscape;margin:12mm}
  </style></head><body><h1>${escapeHtml(values.value["organization.company_name"] ?? "HRIS")} payroll register</h1><div class="meta">${escapeHtml(selectedPeriod.value.name)} Â· ${date(selectedPeriod.value.date_from)} â€“ ${date(selectedPeriod.value.date_to)} Â· Pay date ${date(selectedPeriod.value.payout_date)} Â· ${escapeHtml(selectedPeriod.value.status)}</div><table><thead><tr><th>Employee no.</th><th>Employee</th><th>Worked</th><th>Paid leave</th><th>Unpaid leave</th><th>Absent</th><th>Gross</th><th>Deductions</th><th>Net pay</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div>Total gross<strong>${money(selectedPeriod.value.total_gross)}</strong></div><div>Total deductions<strong>${money(selectedPeriod.value.total_deductions)}</strong></div><div>Total net<strong>${money(selectedPeriod.value.total_net)}</strong></div></div></body></html>`);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};
const money = (value: any) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value || 0),
  );
const number = (value: any) =>
  new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(
    Number(value || 0),
  );
const statusColor = (status: string) =>
  ({
    draft: "default",
    processed: "info",
    approved: "warning",
    paid: "success",
  })[status] ?? "default";
const printPayslip = () => window.print();
</script>

<style scoped>
.payroll-page {
  max-width: 1500px;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
}
.summary-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 4px 11px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.summary-card .v-icon {
  grid-row: span 2;
}
.summary-card span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.76rem;
}
.summary-card strong {
  font-size: 1.1rem;
}
.dialog-heading small,
.employee-copy small {
  color: rgb(var(--v-theme-on-surface-variant));
}
.dialog-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 18px 20px;
}
.dialog-heading > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.span-2 {
  grid-column: 1 / -1;
}
.period-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.period-totals {
  display: flex;
  min-width: 180px;
  flex-direction: column;
}
.period-totals span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.75rem;
}
.exception-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-warning), 0.1);
}
.exception-banner > div {
  display: flex;
  flex: 1;
  flex-direction: column;
}
.exception-banner span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.78rem;
}
.payslip-list {
  display: grid;
  gap: 9px;
}
.payslip-row {
  display: grid;
  grid-template-columns:
    auto minmax(145px, 1fr) minmax(145px, 0.8fr) repeat(3, minmax(95px, auto))
    auto auto;
  align-items: center;
  gap: 14px;
  padding: 13px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.employee-copy,
.pay-metric,
.work-summary {
  display: flex;
  flex-direction: column;
}
.work-summary {
  align-items: flex-start;
  gap: 2px;
}
.work-summary span,
.work-summary small {
  font-size: 0.72rem;
}
.work-summary small {
  color: rgb(var(--v-theme-on-surface-variant));
}
.pay-metric span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.72rem;
}
.pay-metric--net strong {
  color: rgb(var(--v-theme-success));
}
.empty-state {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.work-summary-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 18px;
}
.work-summary-card > div {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.work-summary-card span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.72rem;
}
.payslip-exceptions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 13px;
  border-radius: 11px;
  background: rgba(var(--v-theme-warning), 0.09);
}
.payslip-exceptions ul {
  margin: 0;
  padding-left: 25px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.82rem;
}
.payslip-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px;
}
.payslip-columns h3 {
  margin-bottom: 10px;
}
.amount-line {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 8px 0;
}
.amount-line--total {
  margin-top: 5px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
.net-pay {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22px;
  padding: 17px;
  border-radius: 12px;
  background: rgba(var(--v-theme-success), 0.11);
}
.net-pay strong {
  font-size: 1.35rem;
  color: rgb(var(--v-theme-success));
}
.payslip-note {
  display: flex;
  flex-direction: column;
  margin-top: 15px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}
@media (max-width: 1050px) {
  .payslip-row {
    grid-template-columns: auto 1fr minmax(140px, auto) auto auto;
  }
  .pay-metric {
    display: none;
  }
}
@media (max-width: 650px) {
  .page-heading,
  .period-toolbar,
  .exception-banner {
    align-items: stretch;
    flex-direction: column;
  }
  .summary-grid,
  .form-grid,
  .payslip-columns,
  .work-summary-card {
    grid-template-columns: 1fr;
  }
  .payslip-row {
    grid-template-columns: auto 1fr auto auto;
  }
  .work-summary {
    display: none;
  }
  .span-2 {
    grid-column: 1;
  }
}
</style>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #printable-payslip,
  #printable-payslip * {
    visibility: visible;
  }
  #printable-payslip {
    position: absolute;
    inset: 0;
    background: white;
    color: black;
  }
  #printable-payslip .no-print {
    display: none !important;
  }
}
</style>
