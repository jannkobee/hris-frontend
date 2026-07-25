<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :form="form"
    :data="data"
    :fields="activeFields"
    @close="close"
    @execute="execute"
  />

  <v-container fluid>
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="requests">Leave Requests</v-tab>
      <v-tab value="credits">Leave Credits</v-tab>
      <v-tab value="creditSettings">Leave Credit Settings</v-tab>
      <v-tab value="conversions">Leave Conversions</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item v-for="key in tabKeys" :key="key" :value="key">
        <Table
          :entity="tabs[key].entity"
          :title="tabs[key].title"
          :headers="tabs[key].fields.value"
          :data="tabs[key].api.items.value"
          :loading="tabs[key].api.loading.value"
          :pagination="tabs[key].api.pagination.value"
          :relations="tabs[key].relations"
          @filter="
            (opts: any) =>
              tabs[key].api.index({ relations: tabs[key].relations, ...opts })
          "
          @create="() => openForm(key, 'Create')"
          @view="(item: any) => openForm(key, 'View', item)"
          @edit="(item: any) => openForm(key, 'Edit', item)"
          @remove="(item: any) => openForm(key, 'Remove', item)"
        >
          <template v-if="key === 'conversions'" #extra-actions="{ item }">
            <v-btn
              v-if="item.status === 'pending'"
              size="small"
              color="success"
              variant="text"
              :loading="conversionActionLoading === item.id"
              @click="approveConversion(item)"
            >
              Approve
            </v-btn>
            <v-btn
              v-if="item.status === 'pending'"
              size="small"
              color="error"
              variant="text"
              :loading="conversionActionLoading === item.id"
              @click="rejectConversion(item)"
            >
              Reject
            </v-btn>
          </template>
        </Table>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import axios from "@/plugins/axios";
import { useApi } from "@/composables/useApi";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import type { ColumnConfig } from "@/types/types";

import { fields as requestFieldsRaw } from "@/fields/leave_request";
import { fields as creditFieldsRaw } from "@/fields/leave_credit";
import { fields as creditSettingFieldsRaw } from "@/fields/leave_credit_setting";
import { fields as conversionFieldsRaw } from "@/fields/leave_conversion_request";

type TabKey = "requests" | "credits" | "creditSettings" | "conversions";

const activeTab = ref<TabKey>("requests");
const entity = ref("LeaveRequest");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);
const conversionActionLoading = ref<string | null>(null);

const requestFields = ref<ColumnConfig[]>([...requestFieldsRaw]);
const creditFields = ref<ColumnConfig[]>([...creditFieldsRaw]);
const creditSettingFields = ref<ColumnConfig[]>([...creditSettingFieldsRaw]);
const conversionFields = ref<ColumnConfig[]>([...conversionFieldsRaw]);

const requestApi = useApi("/leave-requests");
const creditApi = useApi("/leave-credits");
const creditSettingApi = useApi("/leave-credit-settings");
const conversionApi = useApi("/leave-conversion-requests");

const { getOptions: getEmployees } = useApi("/employees");
const { getOptions: getLeaveTypes } = useApi("/leave-types");

const emptyRequestForm = () => ({
  id: "",
  employee_id: "",
  leave_type_id: "",
  start_date: "",
  end_date: "",
  reason: "",
  status: "pending",
});

const emptyCreditForm = () => ({
  id: "",
  employee_id: "",
  leave_type_id: "",
  year: new Date().getFullYear(),
  total_earned: 0,
  used: 0,
});

const emptyCreditSettingForm = () => ({
  id: "",
  leave_type_id: "",
  name: "",
  description: "",
  credit_amount: 0,
  frequency: "monthly",
  run_months: [],
  is_active: true,
});

const emptyConversionForm = () => ({
  id: "",
  employee_id: "",
  leave_type_id: "",
  credits_requested: 0,
  monetary_value: null,
  reason: "",
});

const tabs = {
  requests: {
    entity: "LeaveRequest",
    title: "Manage Leave Requests",
    fields: requestFields,
    relations: "employee.user,leaveType,approver",
    emptyForm: emptyRequestForm,
    api: requestApi,
  },
  credits: {
    entity: "LeaveCredit",
    title: "Employee Leave Balances",
    fields: creditFields,
    relations: "employee.user,leaveType",
    emptyForm: emptyCreditForm,
    api: creditApi,
  },
  creditSettings: {
    entity: "LeaveCreditSetting",
    title: "Leave Credit Accrual Settings",
    fields: creditSettingFields,
    relations: "leaveType",
    emptyForm: emptyCreditSettingForm,
    api: creditSettingApi,
  },
  conversions: {
    entity: "LeaveConversionRequest",
    title: "Leave Conversion Requests",
    fields: conversionFields,
    relations: "employee.user,leaveType,approver",
    emptyForm: emptyConversionForm,
    api: conversionApi,
  },
} as const;

const tabKeys = Object.keys(tabs) as TabKey[];

const loadingActions = computed(() =>
  tabKeys.some((key) => tabs[key].api.loadingActions.value),
);

const activeFields = computed(() => tabs[activeTab.value].fields.value);

const form = computed(() => tabs[activeTab.value].emptyForm());

const readOnly = () => action.value === "View";

const setSelectOptions = (
  selectKey: string,
  options: any[],
  label: string | ((option: any) => string),
) => {
  const mapped = options.map((option) => ({
    label: typeof label === "function" ? label(option) : option[label] ?? "",
    value: option.id,
  }));

  tabKeys.forEach((key) => {
    const field = tabs[key].fields.value.find(
      (item) => item.selectKey === selectKey,
    );
    if (field) field.inputOptions = mapped;
  });
};

const loadOptions = async () => {
  const [employees, leaveTypes] = await Promise.all([
    getEmployees({ relations: "user" }),
    getLeaveTypes(),
  ]);

  setSelectOptions(
    "employee_id",
    employees,
    (employee) =>
      `${employee.user?.first_name ?? ""} ${
        employee.user?.last_name ?? ""
      }`.trim() || employee.employee_no,
  );
  setSelectOptions("leave_type_id", leaveTypes, "name");
};

const openForm = (key: TabKey, actionName: string, item?: any) => {
  entity.value = tabs[key].entity;
  action.value = actionName;
  data.value = actionName === "Create" ? tabs[key].emptyForm() : { ...item };
  isFormVisible.value = true;
};

const close = () => {
  isFormVisible.value = false;
};

const execute = async (payload: any) => {
  const meta = tabs[activeTab.value];

  try {
    if (action.value === "Create") await meta.api.store(payload);
    if (action.value === "Edit") await meta.api.update(payload.id, payload);
    if (action.value === "Remove") await meta.api.destroy(payload.id);

    isFormVisible.value = false;
  } catch (error) {
    console.error(`Unable to save ${meta.entity}:`, error);
  }
};

// Approve/reject aren't plain CRUD, so they bypass useApi's store/update
// and hit the two extra endpoints directly, then refresh the tab.
const approveConversion = async (item: any) => {
  conversionActionLoading.value = item.id;

  try {
    await axios.post(`/leave-conversion-requests/${item.id}/approve`);
    await conversionApi.index({ relations: tabs.conversions.relations });
  } catch (error) {
    console.error("Unable to approve conversion request:", error);
  } finally {
    conversionActionLoading.value = null;
  }
};

const rejectConversion = async (item: any) => {
  const remarks =
    window.prompt("Reason for rejecting (optional):") ?? undefined;
  conversionActionLoading.value = item.id;

  try {
    await axios.post(`/leave-conversion-requests/${item.id}/reject`, {
      remarks,
    });
    await conversionApi.index({ relations: tabs.conversions.relations });
  } catch (error) {
    console.error("Unable to reject conversion request:", error);
  } finally {
    conversionActionLoading.value = null;
  }
};

onMounted(async () => {
  await Promise.all([
    loadOptions(),
    requestApi.index({ relations: tabs.requests.relations }),
    creditApi.index({ relations: tabs.credits.relations }),
    creditSettingApi.index({ relations: tabs.creditSettings.relations }),
    conversionApi.index({ relations: tabs.conversions.relations }),
  ]);
});
</script>
